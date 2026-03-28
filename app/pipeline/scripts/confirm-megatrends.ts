// confirm-megatrends.ts — Upgrade-01b
//
// Batch semantic check for all candidate megatrends.
// Runs checkMegatrendSemantic() (checker + critic) for each candidate,
// then updates confirmation_status and priority in DB.
//
// Usage: npm run pipeline:confirm-megatrends
//
// Options:
//   --all      Also re-check already confirmed megatrends
//   --dry-run  Print results without updating DB

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { setupDb } from '../db/setup'
import { getDb } from '../db/client'
import { checkMegatrendSemantic } from '../megatrends/semantic-checker'
import type { MegatrendRow } from '../types'

const DELAY_MS = 400  // ms between LLM pairs (2 calls per megatrend)

const VERDICT_ICON: Record<string, string> = {
  confirmed_shift: '★',
  confirmed:       '✓',
  candidate:       '~',
  topic:           '↓',
  signal:          '↓↓',
}
const PRIORITY_COLOR: Record<string, string> = {
  high: 'HIGH', medium: 'MED', low: 'LOW',
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const reCheckAll = args.includes('--all')

  // Ensure new columns exist
  setupDb()

  const db = getDb()

  // Pipeline-09: only process topics that passed the soft critic gate.
  // topic_critic_verdict='approve' = passed soft gate.
  // topic_critic_verdict IS NULL   = legacy rows (no critic data yet — include for compat).
  // topic_critic_verdict='reject'  = failed soft gate — skip (stays signal).
  const statusFilter = reCheckAll
    ? `confirmation_status IN ('topic', 'confirmed_shift', 'candidate', 'confirmed')`
    : `confirmation_status = 'topic' AND (topic_critic_verdict = 'approve' OR topic_critic_verdict IS NULL)`

  const rows = db.prepare(`
    SELECT * FROM megatrends
    WHERE ${statusFilter}
    AND status NOT IN ('archived_dup')
    ORDER BY total_score DESC
  `).all() as MegatrendRow[]

  if (!rows.length) {
    console.log('No candidates to check. Run pipeline:migrate-01a first if needed.')
    process.exit(0)
  }

  console.log(`=== Semantic check: ${rows.length} megatrends${dryRun ? ' [DRY RUN]' : ''} ===\n`)

  const update = db.prepare(`
    UPDATE megatrends SET
      confirmation_status         = ?,
      priority                    = ?,
      confirmed_critic_verdict    = ?,
      confirmed_critic_reason     = ?,
      confirmed_critic_checked_at = datetime('now'),
      updated_at                  = datetime('now')
    WHERE id = ?
  `)

  const counts = { confirmed_shift: 0, confirmed: 0, candidate: 0, topic: 0, signal: 0 }
  const priorities = { high: 0, medium: 0, low: 0 }
  let errors = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const result = await checkMegatrendSemantic(row.title, row.summary, row.why_growing)

      const icon   = VERDICT_ICON[result.confirmation_status] ?? '?'
      const pri    = PRIORITY_COLOR[result.priority] ?? '?'
      const yes    = result.yes_count

      // Explain why the status was assigned
      let statusReason = ''
      if (result.confirmation_status === 'confirmed_shift') {
        statusReason = `  ✓ ${yes}/5 + critic approved`
      } else if (result.confirmation_status === 'topic') {
        if (result.critic_verdict === 'downgrade') {
          statusReason = `  ← downgraded: ${result.critic_issues[0] ?? result.critic_reasoning}`
        } else {
          statusReason = `  ← checker ${yes}/5 (need 4+ for confirmed)`
        }
      } else if (result.confirmation_status === 'signal') {
        const reason = result.critic_verdict === 'reject'
          ? result.critic_issues[0] ?? result.critic_reasoning
          : `checker ${yes}/5`
        statusReason = `  ← rejected: ${reason}`
      }

      console.log(
        `  [${String(i + 1).padStart(2)}/${rows.length}] ${icon.padEnd(3)} ${pri.padEnd(4)} ` +
        `${row.title.slice(0, 50).padEnd(50)}${statusReason}`
      )

      if (!dryRun) {
        update.run(
          result.confirmation_status,
          result.priority,
          result.critic_verdict,
          result.critic_issues[0] ?? result.critic_reasoning,
          row.id,
        )
      }

      counts[result.confirmation_status as keyof typeof counts]++
      priorities[result.priority]++

    } catch (err) {
      console.error(`  [ERROR] ${row.id} — ${(err as Error).message}`)
      errors++
    }

    if (i < rows.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  console.log(`\n=== Results${dryRun ? ' (dry run — DB not updated)' : ''} ===`)
  console.log(`  confirmed_shift: ${counts.confirmed_shift}`)
  console.log(`  confirmed:       ${counts.confirmed}`)
  console.log(`  candidate:       ${counts.candidate}`)
  console.log(`  topic:           ${counts.topic}`)
  console.log(`  signal:          ${counts.signal}`)
  console.log(`  priority high/med/low: ${priorities.high}/${priorities.medium}/${priorities.low}`)
  if (errors) console.log(`  errors: ${errors}`)

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
