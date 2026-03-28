// Extract megatrends from raw_signals using LLM.
// Processes signals not yet marked as megatrend-extracted.
// Usage: npm run pipeline:extract-megatrends

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { getDb } from '../db/client'
import { extractMegatrend } from '../megatrends/extractor'
import type { RawSignalRow } from '../types'

const BATCH = parseInt(process.argv[2] ?? '30', 10)

async function main() {
  const db = getDb()

  // Get signals not yet processed for megatrend extraction
  // We track this via json_extract(metadata, '$.mt_extracted') IS NULL
  const signals = db.prepare(`
    SELECT * FROM raw_signals
    WHERE json_extract(metadata, '$.mt_extracted') IS NULL
    ORDER BY date DESC
    LIMIT ?
  `).all(BATCH) as RawSignalRow[]

  if (!signals.length) {
    console.log('No unprocessed signals')
    process.exit(0)
  }

  console.log(`=== Megatrend extraction: ${signals.length} signals ===\n`)

  const markProcessed = db.prepare(`
    UPDATE raw_signals
    SET metadata = json_set(metadata, '$.mt_extracted', 1)
    WHERE signal_id = ?
  `)

  let inserted = 0
  let merged   = 0
  let discarded = 0

  for (const signal of signals) {
    const meta = JSON.parse(signal.metadata ?? '{}')
    const sourceName = meta.source_name ?? signal.source_id
    const text = signal.raw_text
    const shortText = text.slice(0, 80).replace(/\n/g, ' ')

    process.stdout.write(`  [${signal.signal_id.slice(0,8)}] ${shortText}… `)

    try {
      const result = await extractMegatrend(text, sourceName, signal.url ?? undefined)
      markProcessed.run(signal.signal_id)

      if (result.inserted && result.isNewMegatrend) {
        console.log(`→ ✓ inserted ${result.megatrendId}`)
        inserted++
      } else if (result.inserted && !result.isNewMegatrend) {
        console.log(`→ ⟳ merged into ${result.megatrendId}`)
        merged++
      } else {
        console.log(`→ — discarded (${result.reason ?? 'unknown'})`)
        discarded++
      }
    } catch (err) {
      console.log(`→ ✗ error: ${err}`)
      // Don't mark as processed so it can be retried
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\n=== Done: ${inserted} inserted, ${merged} merged, ${discarded} discarded ===`)

  // Show current status distribution so it's clear what's ready for dedup/confirm
  const stats = db.prepare(`
    SELECT confirmation_status, COUNT(*) as cnt
    FROM megatrends
    WHERE status NOT IN ('archived', 'archived_dup')
    GROUP BY confirmation_status
  `).all() as Array<{ confirmation_status: string; cnt: number }>
  if (stats.length) {
    console.log('\nCurrent megatrend statuses (run dedup-megatrends next):')
    for (const s of stats) {
      console.log(`  ${s.confirmation_status.padEnd(16)} ${s.cnt}`)
    }
  }

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
