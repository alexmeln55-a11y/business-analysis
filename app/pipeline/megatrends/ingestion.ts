// Megatrend HTTP ingestion — fetches web sources and saves raw content to raw_signals.
// No Telegram. Supports source_type: webpage | report | rss.

import crypto from 'crypto'
import { getDb } from '../db/client'
import type { SourceRow } from '../types'

// ── Minimal HTML → text ───────────────────────────────────────────────────────

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 12000)
}

// ── RSS item extractor ────────────────────────────────────────────────────────

interface RssItem {
  title: string
  description: string
  link: string
  pubDate: string
}

function extractRssItems(xml: string): RssItem[] {
  const items: RssItem[] = []
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null

  const getText = (block: string, tag: string): string => {
    const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`, 'i')
    const match = re.exec(block)
    return (match?.[1] ?? match?.[2] ?? '').trim()
  }

  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1]
    items.push({
      title:       getText(block, 'title'),
      description: getText(block, 'description'),
      link:        getText(block, 'link'),
      pubDate:     getText(block, 'pubDate') || new Date().toISOString(),
    })
  }
  return items
}

// ── Source config type ────────────────────────────────────────────────────────

interface SourceConfig {
  url: string
  vertical?: string
  region?: string
  priority?: number
  fetchMode?: 'full_page' | 'rss' | 'summary'
}

// ── Ingest single source ──────────────────────────────────────────────────────

export async function ingestMegatrendSource(source: SourceRow): Promise<number> {
  const db = getDb()
  const config = JSON.parse(source.config) as SourceConfig
  const { url, fetchMode } = config

  if (!url) {
    console.warn(`  [${source.source_name}] No URL in config, skipping`)
    return 0
  }

  console.log(`Fetching ${source.source_name} (${source.source_type})...`)

  let response: Response
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; research-bot/1.0)' },
      signal: AbortSignal.timeout(20_000),
    })
  } catch (err) {
    console.error(`  Fetch failed: ${err}`)
    return 0
  }

  if (!response.ok) {
    console.error(`  HTTP ${response.status} for ${url}`)
    return 0
  }

  const rawBody = await response.text()
  const isRss = source.source_type === 'rss' || fetchMode === 'rss' ||
    rawBody.trimStart().startsWith('<?xml') ||
    rawBody.includes('<rss') ||
    rawBody.includes('<feed')

  const insert = db.prepare(`
    INSERT OR IGNORE INTO raw_signals
      (signal_id, source_id, external_id, raw_text, url, author, date, hash, metadata)
    VALUES
      (@signal_id, @source_id, @external_id, @raw_text, @url, @author, @date, @hash, @metadata)
  `)

  const updateCursor = db.prepare(`
    UPDATE sources SET last_cursor = @cursor, updated_at = datetime('now') WHERE source_id = @source_id
  `)

  let saved = 0

  if (isRss) {
    // ── RSS: one raw_signal per item ──────────────────────────────────────────
    const items = extractRssItems(rawBody)
    if (!items.length) {
      console.log(`  No RSS items found`)
      return 0
    }

    const insertMany = db.transaction((rssItems: RssItem[]) => {
      for (const item of rssItems) {
        const text = [item.title, item.description].filter(Boolean).join('\n\n')
        if (text.length < 20) continue
        const hash = crypto.createHash('sha256').update(text).digest('hex')
        insert.run({
          signal_id:   crypto.randomUUID(),
          source_id:   source.source_id,
          external_id: hash.slice(0, 16),
          raw_text:    text.slice(0, 8000),
          url:         item.link || url,
          author:      null,
          date:        new Date(item.pubDate).toISOString(),
          hash,
          metadata:    JSON.stringify({ source_type: source.source_type, vertical: config.vertical }),
        })
        saved++
      }
    })
    insertMany(items)
  } else {
    // ── Webpage / report: one raw_signal for the whole page ──────────────────
    const text = htmlToText(rawBody)
    if (text.length < 100) {
      console.log(`  Page content too short, skipping`)
      return 0
    }
    const hash = crypto.createHash('sha256').update(text).digest('hex')

    // Skip if already ingested this exact version
    const existing = db.prepare(`SELECT signal_id FROM raw_signals WHERE hash = ?`).get(hash)
    if (existing) {
      console.log(`  Already ingested (same hash), skipping`)
      return 0
    }

    insert.run({
      signal_id:   crypto.randomUUID(),
      source_id:   source.source_id,
      external_id: hash.slice(0, 16),
      raw_text:    text,
      url,
      author:      null,
      date:        new Date().toISOString(),
      hash,
      metadata:    JSON.stringify({ source_type: source.source_type, vertical: config.vertical }),
    })
    saved = 1
  }

  updateCursor.run({ cursor: new Date().toISOString(), source_id: source.source_id })
  console.log(`  Saved ${saved} entries`)
  return saved
}

// ── Run all active megatrend sources ─────────────────────────────────────────

export async function runMegatrendIngestion(): Promise<void> {
  const db = getDb()
  const sources = db.prepare(`
    SELECT * FROM sources
    WHERE is_active = 1 AND source_type IN ('webpage', 'report', 'rss')
    ORDER BY json_extract(config, '$.priority') DESC
  `).all() as SourceRow[]

  if (!sources.length) {
    console.log('No active megatrend sources. Run: npm run pipeline:seed-megatrend-sources')
    return
  }

  console.log(`Found ${sources.length} active sources\n`)
  let total = 0
  for (const source of sources) {
    total += await ingestMegatrendSource(source)
  }
  console.log(`\nTotal saved: ${total} raw entries`)
}
