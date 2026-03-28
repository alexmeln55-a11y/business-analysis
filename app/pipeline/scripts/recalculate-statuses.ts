// recalculate-statuses.ts — Rules-01
//
// Rescores all non-archived megatrends against the unified status rules.
//
// What it does:
//   1. Recalculates confirmation_status for every record using deriveStatusForRecalculation:
//      - confirmed_shift that fails numeric pre-filter → downgraded to topic/signal
//      - legacy 'confirmed' → recalculated as topic/signal
//      - legacy 'candidate' → recalculated as topic/signal
//      - topic/signal       → recalculated (metrics may have changed)
//   2. Resets topic_critic_verdict for records newly downgraded to 'topic'
//      so the dedup critic can re-validate them.
//   3. Prints before → after summary and a list of records that lost confirmed_shift.
//
// Usage:
//   npm run pipeline:recalculate-statuses           — preview (dry run)
//   npm run pipeline:recalculate-statuses -- --apply — apply changes

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { setupDb } from '../db/setup'
import { getDb } from '../db/client'
import { deriveStatusForRecalculation } from '../megatrends/status-rules'
import type { MegatrendRow } from '../types'

type StatusBucket = Record<string, number>

function countBy(rows: MegatrendRow[], key: keyof MegatrendRow): StatusBucket {
  const result: StatusBucket = {}
  for (const r of rows) {
    const v = String(r[key] ?? 'null')
    result[v] = (result[v] ?? 0) + 1
  }
  return result
}

function printBucket(label: string, bucket: StatusBucket) {
  console.log(`\n${label}`)
  for (const [k, v] of Object.entries(bucket).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(20)} ${v}`)
  }
}

async function main() {
  const args  = process.argv.slice(2)
  const apply = args.includes('--apply')

  setupDb()
  const db = getDb()

  const rows = db.prepare(`
    SELECT * FROM megatrends
    WHERE status NOT IN ('archived', 'archived_dup')
    ORDER BY confirmation_status, total_score DESC
  `).all() as MegatrendRow[]

  if (!rows.length) {
    console.log('No megatrends to recalculate.')
    process.exit(0)
  }

  console.log(`=== Rules-01 status recalculation: ${rows.length} records${apply ? '' : ' [DRY RUN — use --apply to write]'} ===\n`)

  const before = countBy(rows, 'confirmation_status')
  printBucket('Before:', before)

  // ── Compute new statuses ───────────────────────────────────────────────────

  type Change = {
    id: string
    title: string
    oldStatus: string
    newStatus: string
    uniqueSources: number
    activeDays: number
  }

  const changes: Change[] = []
  const lostConfirmedShift: Change[] = []

  const updateStatus = db.prepare(`
    UPDATE megatrends SET
      confirmation_status  = ?,
      -- Reset topic critic when landing on 'topic' so dedup can re-validate
      topic_critic_verdict    = CASE WHEN ? = 'topic' THEN NULL ELSE topic_critic_verdict END,
      topic_critic_reason     = CASE WHEN ? = 'topic' THEN NULL ELSE topic_critic_reason END,
      topic_critic_checked_at = CASE WHEN ? = 'topic' THEN NULL ELSE topic_critic_checked_at END,
      -- Reset confirmed critic when downgraded from confirmed_shift
      confirmed_critic_verdict    = CASE WHEN ? != 'confirmed_shift' AND confirmation_status = 'confirmed_shift' THEN NULL ELSE confirmed_critic_verdict END,
      confirmed_critic_reason     = CASE WHEN ? != 'confirmed_shift' AND confirmation_status = 'confirmed_shift' THEN NULL ELSE confirmed_critic_reason END,
      confirmed_critic_checked_at = CASE WHEN ? != 'confirmed_shift' AND confirmation_status = 'confirmed_shift' THEN NULL ELSE confirmed_critic_checked_at END,
      updated_at = datetime('now')
    WHERE id = ?
  `)

  for (const row of rows) {
    const newStatus = deriveStatusForRecalculation(
      row.unique_sources_count,
      row.active_days,
      row.confirmation_status as string,
    )

    if (newStatus !== row.confirmation_status) {
      const change: Change = {
        id:            row.id,
        title:         row.title,
        oldStatus:     row.confirmation_status as string,
        newStatus,
        uniqueSources: row.unique_sources_count,
        activeDays:    row.active_days,
      }
      changes.push(change)
      if (row.confirmation_status === 'confirmed_shift') {
        lostConfirmedShift.push(change)
      }
    }
  }

  // ── Print changes ──────────────────────────────────────────────────────────

  if (!changes.length) {
    console.log('\n✓ No changes needed — all statuses already conform to Rules-01.')
    process.exit(0)
  }

  console.log(`\nChanges (${changes.length} records):`)
  for (const c of changes) {
    const arrow = `${c.oldStatus.padEnd(16)} → ${c.newStatus}`
    const meta  = `[${c.uniqueSources}src × ${c.activeDays}d]`
    console.log(`  ${arrow.padEnd(36)} ${meta}  ${c.title.slice(0, 50)}`)
  }

  if (lostConfirmedShift.length) {
    console.log(`\n⚠ Records losing confirmed_shift (${lostConfirmedShift.length}):`)
    for (const c of lostConfirmedShift) {
      console.log(`  → ${c.newStatus.padEnd(8)} [${c.uniqueSources}src × ${c.activeDays}d]  ${c.title.slice(0, 60)}`)
      console.log(`    Reason: ${c.uniqueSources < 3 ? `only ${c.uniqueSources} sources (need 3+)` : `only ${c.activeDays} days (need 30+)`}`)
    }
  }

  if (!apply) {
    console.log('\n→ Dry run complete. Run with --apply to write changes to DB.')
    process.exit(0)
  }

  // ── Apply changes ──────────────────────────────────────────────────────────

  const applyAll = db.transaction(() => {
    for (const c of changes) {
      updateStatus.run(
        c.newStatus,
        c.newStatus, c.newStatus, c.newStatus,  // topic_critic CASE WHEN x3
        c.newStatus, c.newStatus, c.newStatus,  // confirmed_critic CASE WHEN x3
        c.id,
      )
    }
  })

  applyAll()

  // Print after
  const after = countBy(
    db.prepare(`SELECT confirmation_status FROM megatrends WHERE status NOT IN ('archived', 'archived_dup')`).all() as MegatrendRow[],
    'confirmation_status',
  )
  printBucket('After:', after)

  console.log(`\n✓ Applied ${changes.length} status changes.`)
  if (lostConfirmedShift.length) {
    console.log(`  ${lostConfirmedShift.length} records downgraded from confirmed_shift.`)
    console.log(`  These records stay as topic/signal until they accumulate enough evidence.`)
  }

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
