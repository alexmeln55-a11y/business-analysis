// generate-ideas.ts — Shifts-01
// Generates business ideas for all confirmed_shift topics that don't yet have ideas.
//
// Usage:
//   npm run pipeline:generate-ideas           — only topics without ideas
//   npm run pipeline:generate-ideas -- --all  — regenerate ideas for all confirmed_shifts
//   npm run pipeline:generate-ideas -- --dry-run

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { setupDb } from '../db/setup'
import { getDb } from '../db/client'
import { generateIdeasForShift, saveIdeas, deleteIdeasForShift } from '../megatrends/idea-generator'
import type { MegatrendRow } from '../types'

const DELAY_MS = 500

async function main() {
  const args = process.argv.slice(2)
  const dryRun  = args.includes('--dry-run')
  const regenAll = args.includes('--all')

  setupDb()

  const db = getDb()

  // Find confirmed_shifts (also support legacy 'confirmed' status)
  const shifts = db.prepare(`
    SELECT * FROM megatrends
    WHERE confirmation_status IN ('confirmed_shift', 'confirmed')
    AND status NOT IN ('archived_dup')
    ORDER BY total_score DESC
  `).all() as MegatrendRow[]

  if (!shifts.length) {
    console.log('No confirmed_shift topics found. Run pipeline:confirm-megatrends first.')
    process.exit(0)
  }

  // Filter: only those without ideas (unless --all)
  const toProcess = regenAll
    ? shifts
    : shifts.filter(shift => {
        const count = db.prepare(
          `SELECT COUNT(*) as n FROM business_ideas WHERE shift_id = ?`
        ).get(shift.id) as { n: number }
        return count.n === 0
      })

  console.log(`=== Generating ideas for ${toProcess.length}/${shifts.length} confirmed shifts${dryRun ? ' [DRY RUN]' : ''} ===\n`)

  let totalIdeas = 0
  let errors = 0

  for (let i = 0; i < toProcess.length; i++) {
    const shift = toProcess[i]
    try {
      const ideas = await generateIdeasForShift(
        shift.id, shift.title, shift.summary, shift.why_growing,
      )

      console.log(`  [${i + 1}/${toProcess.length}] ${shift.title.slice(0, 50)}`)
      ideas.forEach((idea, j) => {
        console.log(`    ${j + 1}. ${idea.title}`)
      })

      if (!dryRun) {
        if (regenAll) deleteIdeasForShift(shift.id)
        saveIdeas(ideas)
      }

      totalIdeas += ideas.length
    } catch (err) {
      console.error(`  [ERROR] ${shift.id} — ${(err as Error).message}`)
      errors++
    }

    if (i < toProcess.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  console.log(`\n=== Done${dryRun ? ' (dry run)' : ''} ===`)
  console.log(`  Shifts processed: ${toProcess.length}`)
  console.log(`  Ideas generated:  ${totalIdeas}`)
  if (errors) console.log(`  Errors: ${errors}`)

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
