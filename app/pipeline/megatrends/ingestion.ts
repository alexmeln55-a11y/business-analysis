// Megatrend HTTP ingestion — fetches web sources and saves raw content to raw_signals.
// No Telegram. Supports source_type: webpage | report | rss.

import crypto from 'crypto'
import { getDb } from '../db/client'
import type { SourceRow } from '../types'

// ── Source run logging ────────────────────────────────────────────────────────

interface RunResult {
  total_found: number
  new_found: number
  duplicates_found: number
  error?: string
}

function startSourceRun(sourceId: string): string {
  const db = getDb()
  const runId = `run_${crypto.randomBytes(6).toString('hex')}`
  db.prepare(`
    INSERT INTO source_runs (id, source_id, started_at, status)
    VALUES (?, ?, datetime('now'), 'running')
  `).run(runId, sourceId)
  return runId
}

function finishSourceRun(runId: string, result: RunResult): void {
  const db = getDb()
  const status = result.error ? 'error' : 'success'
  db.prepare(`
    UPDATE source_runs SET
      finished_at      = datetime('now'),
      status           = ?,
      total_found      = ?,
      new_found        = ?,
      duplicates_found = ?,
      error_message    = ?
    WHERE id = ?
  `).run(status, result.total_found, result.new_found, result.duplicates_found, result.error ?? null, runId)
}

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

export async function ingestMegatrendSource(source: SourceRow): Promise<RunResult> {
  const db = getDb()
  const config = JSON.parse(source.config) as SourceConfig
  const { url, fetchMode } = config

  if (!url) {
    console.warn(`  [${source.source_name}] No URL in config, skipping`)
    return { total_found: 0, new_found: 0, duplicates_found: 0, error: 'No URL in config' }
  }

  console.log(`Fetching ${source.source_name} (${source.source_type})...`)

  let response: Response
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; research-bot/1.0)' },
      signal: AbortSignal.timeout(20_000),
    })
  } catch (err) {
    const msg = `Fetch failed: ${err}`
    console.error(`  ${msg}`)
    return { total_found: 0, new_found: 0, duplicates_found: 0, error: msg }
  }

  if (!response.ok) {
    const msg = `HTTP ${response.status} for ${url}`
    console.error(`  ${msg}`)
    return { total_found: 0, new_found: 0, duplicates_found: 0, error: msg }
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
    UPDATE sources SET
      last_cursor = @cursor,
      updated_at  = datetime('now')
    WHERE source_id = @source_id
  `)

  let newFound = 0
  let duplicatesFound = 0

  if (isRss) {
    // ── RSS: one raw_signal per item ──────────────────────────────────────────
    const items = extractRssItems(rawBody)
    if (!items.length) {
      console.log(`  No RSS items found`)
      return { total_found: 0, new_found: 0, duplicates_found: 0 }
    }

    const insertMany = db.transaction((rssItems: RssItem[]) => {
      for (const item of rssItems) {
        const text = [item.title, item.description].filter(Boolean).join('\n\n')
        if (text.length < 20) continue
        const hash = crypto.createHash('sha256').update(text).digest('hex')
        const result = insert.run({
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
        if (result.changes > 0) newFound++
        else duplicatesFound++
      }
    })
    insertMany(items)

    const totalFound = newFound + duplicatesFound
    updateCursor.run({ cursor: new Date().toISOString(), source_id: source.source_id })
    console.log(`  Saved ${newFound} entries (${duplicatesFound} duplicates skipped)`)
    return { total_found: totalFound, new_found: newFound, duplicates_found: duplicatesFound }

  } else {
    // ── Webpage / report: one raw_signal for the whole page ──────────────────
    const text = htmlToText(rawBody)
    if (text.length < 100) {
      console.log(`  Page content too short, skipping`)
      return { total_found: 0, new_found: 0, duplicates_found: 0 }
    }
    const hash = crypto.createHash('sha256').update(text).digest('hex')

    const existing = db.prepare(`SELECT signal_id FROM raw_signals WHERE hash = ?`).get(hash)
    if (existing) {
      console.log(`  Already ingested (same hash), skipping`)
      return { total_found: 1, new_found: 0, duplicates_found: 1 }
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

    updateCursor.run({ cursor: new Date().toISOString(), source_id: source.source_id })
    console.log(`  Saved 1 entry`)
    return { total_found: 1, new_found: 1, duplicates_found: 0 }
  }
}

// ── Health rules (Auto-02) ────────────────────────────────────────────────────

const HEALTH_DEGRADED_THRESHOLD = 3  // consecutive errors before status → 'degraded'

const updateSourceSuccess = (db: ReturnType<typeof getDb>, sourceId: string) => {
  db.prepare(`
    UPDATE sources SET
      status             = 'active',
      consecutive_errors = 0,
      last_success_at    = datetime('now'),
      updated_at         = datetime('now')
    WHERE source_id = ?
  `).run(sourceId)
}

const updateSourceError = (db: ReturnType<typeof getDb>, sourceId: string) => {
  db.prepare(`
    UPDATE sources SET
      consecutive_errors = consecutive_errors + 1,
      status = CASE
        WHEN consecutive_errors + 1 >= ? THEN 'degraded'
        ELSE 'error'
      END,
      updated_at = datetime('now')
    WHERE source_id = ?
  `).run(HEALTH_DEGRADED_THRESHOLD, sourceId)
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

  let totalNew = 0
  let totalDuplicates = 0
  let sourcesOk = 0
  let sourcesError = 0

  for (const source of sources) {
    const runId = startSourceRun(source.source_id)

    let result: RunResult
    try {
      result = await ingestMegatrendSource(source)
    } catch (err) {
      const msg = `Unexpected error: ${(err as Error).message}`
      console.error(`  [${source.source_name}] ${msg}`)
      result = { total_found: 0, new_found: 0, duplicates_found: 0, error: msg }
    }

    finishSourceRun(runId, result)

    if (result.error) {
      updateSourceError(db, source.source_id)
      sourcesError++
    } else {
      updateSourceSuccess(db, source.source_id)
      sourcesOk++
      totalNew        += result.new_found
      totalDuplicates += result.duplicates_found
    }
  }

  console.log(`\nTotal saved: ${totalNew} new, ${totalDuplicates} duplicates skipped`)
  console.log(`Sources: ${sourcesOk} ok, ${sourcesError} errors`)

  // Health summary (Auto-02)
  const healthRows = db.prepare(`
    SELECT source_name, status, consecutive_errors, last_success_at
    FROM sources
    WHERE is_active = 1 AND source_type IN ('webpage', 'report', 'rss')
    ORDER BY status ASC, source_name ASC
  `).all() as Array<{
    source_name: string
    status: string
    consecutive_errors: number
    last_success_at: string | null
  }>

  const hasBad = healthRows.some(r => r.status !== 'active')
  if (hasBad) {
    console.log('\n=== Source health ===')
    for (const r of healthRows) {
      const icon = r.status === 'active' ? '✓' : r.status === 'degraded' ? '✗' : '!'
      const extra = r.status === 'degraded'
        ? ` — ${r.consecutive_errors} consecutive errors`
        : r.status === 'error'
          ? ` — error (${r.consecutive_errors}/${HEALTH_DEGRADED_THRESHOLD} before degraded)`
          : ''
      console.log(`  ${icon} ${r.status.padEnd(9)} ${r.source_name}${extra}`)
    }
  }
}
