// migrate-01a.ts — Upgrade-01a migration for existing megatrends
//
// What it does:
//   1. Runs setupDb() to add new columns (idempotent via ALTER TABLE … IGNORE)
//   2. Creates one synthetic megatrend_signal per existing megatrend
//      (so existing data isn't orphaned and metrics can be recalculated)
//   3. Sets confirmation_status = 'candidate' for all existing megatrends
//      (they were already scored, so at minimum they're candidates)
//   4. Fills first_seen_at / last_seen_at from created_at / updated_at
//
// Safe to re-run: signals are inserted once per megatrend (checked by megatrend_id).

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import crypto from 'crypto'
import { setupDb } from '../db/setup'
import { getDb } from '../db/client'
import type { MegatrendRow } from '../types'

function main() {
  // Step 1: ensure new columns exist
  setupDb()

  const db = getDb()

  const megatrends = db.prepare(`SELECT * FROM megatrends`).all() as MegatrendRow[]
  console.log(`Found ${megatrends.length} existing megatrends`)

  const insertSignal = db.prepare(`
    INSERT OR IGNORE INTO megatrend_signals
      (id, megatrend_id, title, summary, source_name, source_url, published_at, region, vertical, confidence)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const updateMegatrend = db.prepare(`
    UPDATE megatrends SET
      confirmation_status  = 'candidate',
      signals_count        = 1,
      sources_count        = 1,
      unique_sources_count = 1,
      regions_count        = 1,
      first_seen_at        = COALESCE(first_seen_at, created_at),
      last_seen_at         = COALESCE(last_seen_at, updated_at),
      active_days          = 1
    WHERE id = ? AND confirmation_status = 'signal'
  `)

  let signalsCreated = 0
  let megatrendsUpdated = 0

  const run = db.transaction(() => {
    for (const mt of megatrends) {
      // Check if synthetic signal already exists for this megatrend
      const exists = db.prepare(
        `SELECT id FROM megatrend_signals WHERE megatrend_id = ? LIMIT 1`
      ).get(mt.id)

      if (!exists) {
        const signalId = `sig_${crypto.randomBytes(6).toString('hex')}`
        insertSignal.run(
          signalId,
          mt.id,
          mt.title,
          mt.summary,
          mt.source_name ?? 'legacy',
          mt.source_url ?? null,
          mt.created_at,   // use creation date as publishedAt
          mt.geography ?? null,
          mt.vertical ?? null,
          0.7,
        )
        signalsCreated++
      }

      // Upgrade confirmation_status only if still at default 'signal'
      const result = updateMegatrend.run(mt.id)
      if (result.changes > 0) megatrendsUpdated++
    }
  })

  run()

  console.log(`\nMigration complete:`)
  console.log(`  Synthetic signals created:  ${signalsCreated}`)
  console.log(`  Megatrends set to candidate: ${megatrendsUpdated}`)
  console.log(`\nAll existing megatrends now have confirmation_status = 'candidate'.`)
  console.log(`New articles will start at 'signal' and accumulate upward.`)
}

main()
