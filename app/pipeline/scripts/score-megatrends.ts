// Recalculates total_score for all megatrends and assigns status.
// Safe to re-run: updates all non-archived rows.
// Usage: npm run pipeline:score-megatrends

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { getDb } from '../db/client'
import { scoreMegatrend, statusFromScore } from '../megatrends/scorer'
import type { MegatrendRow } from '../types'

async function main() {
  const db = getDb()
  const rows = db.prepare(
    `SELECT * FROM megatrends WHERE status != 'archived_dup' ORDER BY created_at ASC`
  ).all() as MegatrendRow[]

  console.log(`=== Scoring ${rows.length} megatrends ===\n`)

  const update = db.prepare(`
    UPDATE megatrends
    SET total_score = ?,
        status      = ?,
        updated_at  = datetime('now')
    WHERE id = ?
  `)

  const counts = { shortlist: 0, watchlist: 0, archive: 0 }

  const runAll = db.transaction(() => {
    for (const row of rows) {
      // Skip rows with missing sub-scores — keep their existing score
      if (!row.structural_strength || !row.demand_signal || !row.longevity ||
          !row.geographic_spread || !row.clarity_of_need || !row.hype_risk) {
        console.log(`  [skip] ${row.id} — missing sub-scores`)
        continue
      }

      const score = scoreMegatrend({
        structural_strength: row.structural_strength,
        demand_signal:       row.demand_signal,
        longevity:           row.longevity,
        geographic_spread:   row.geographic_spread,
        clarity_of_need:     row.clarity_of_need,
        hype_risk:           row.hype_risk,
      })
      const status = statusFromScore(score)
      update.run(score, status, row.id)
      counts[status]++
      console.log(`  ${status.padEnd(10)} ${score.toFixed(1).padStart(4)}  ${row.title.slice(0, 50)}`)
    }
  })

  runAll()

  console.log(`\n=== Done ===`)
  console.log(`  shortlist: ${counts.shortlist}`)
  console.log(`  watchlist: ${counts.watchlist}`)
  console.log(`  archive:   ${counts.archive}`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
