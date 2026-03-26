// Recalibrates scoring for all existing megatrends using anchor-based LLM scoring.
// Re-runs scoring (NOT extraction) for each megatrend based on its existing title/summary/why_growing.
// Updates: sub-scores, reason fields, total_score, status.
// Usage: npm run pipeline:rescore-megatrends

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { getDb } from '../db/client'
import { getCalibatedScores } from '../megatrends/calibrated-scorer'
import { scoreMegatrend, statusFromScore } from '../megatrends/scorer'
import type { MegatrendRow } from '../types'

const DELAY_MS = 300 // ms between LLM calls

async function main() {
  const db = getDb()

  // Run migration first (add reason columns if missing)
  const REASON_COLUMNS = [
    'structural_strength_reason', 'demand_signal_reason', 'longevity_reason',
    'geographic_spread_reason', 'clarity_of_need_reason', 'hype_risk_reason',
  ]
  for (const col of REASON_COLUMNS) {
    try { db.exec(`ALTER TABLE megatrends ADD COLUMN ${col} TEXT`) } catch { /* already exists */ }
  }

  const rows = db.prepare(
    `SELECT * FROM megatrends WHERE status NOT IN ('archived_dup') ORDER BY created_at ASC`
  ).all() as MegatrendRow[]

  console.log(`=== Rescoring ${rows.length} megatrends with calibrated anchors ===\n`)

  const update = db.prepare(`
    UPDATE megatrends SET
      structural_strength        = ?,
      structural_strength_reason = ?,
      demand_signal              = ?,
      demand_signal_reason       = ?,
      longevity                  = ?,
      longevity_reason           = ?,
      geographic_spread          = ?,
      geographic_spread_reason   = ?,
      clarity_of_need            = ?,
      clarity_of_need_reason     = ?,
      hype_risk                  = ?,
      hype_risk_reason           = ?,
      total_score                = ?,
      status                     = ?,
      updated_at                 = datetime('now')
    WHERE id = ?
  `)

  const counts = { shortlist: 0, watchlist: 0, archive: 0 }
  let errors = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const scores = await getCalibatedScores(row.title, row.summary, row.why_growing)
      const totalScore = scoreMegatrend(scores)
      const status = statusFromScore(totalScore)

      update.run(
        scores.structural_strength, scores.structural_strength_reason,
        scores.demand_signal,       scores.demand_signal_reason,
        scores.longevity,           scores.longevity_reason,
        scores.geographic_spread,   scores.geographic_spread_reason,
        scores.clarity_of_need,     scores.clarity_of_need_reason,
        scores.hype_risk,           scores.hype_risk_reason,
        totalScore, status, row.id,
      )

      counts[status]++
      const bar = '■'.repeat(Math.round(totalScore)) + '□'.repeat(10 - Math.round(totalScore))
      console.log(`  [${i + 1}/${rows.length}] ${status.padEnd(10)} ${totalScore.toFixed(1)} ${bar}  ${row.title.slice(0, 45)}`)
    } catch (err) {
      console.error(`  [ERROR] ${row.id} — ${(err as Error).message}`)
      errors++
    }

    if (i < rows.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  console.log(`\n=== Done ===`)
  console.log(`  shortlist: ${counts.shortlist}`)
  console.log(`  watchlist: ${counts.watchlist}`)
  console.log(`  archive:   ${counts.archive}`)
  if (errors) console.log(`  errors:    ${errors}`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
