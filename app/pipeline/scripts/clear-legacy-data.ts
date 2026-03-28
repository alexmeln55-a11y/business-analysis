// clear-legacy-data.ts — Shifts-01
//
// Clears all old megatrend records collected under the old logic.
// Keeps: schema, sources registry, raw_signals.
// Deletes: megatrends, megatrend_signals, business_ideas.
//
// Usage: npm run pipeline:clear-legacy-data
// Safe: will ask for confirmation unless --force flag is passed.

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { setupDb } from '../db/setup'
import { getDb } from '../db/client'
import * as readline from 'readline'

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y')
    })
  })
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')

  setupDb()
  const db = getDb()

  const counts = {
    megatrends:        (db.prepare(`SELECT COUNT(*) as n FROM megatrends`).get() as { n: number }).n,
    megatrend_signals: (db.prepare(`SELECT COUNT(*) as n FROM megatrend_signals`).get() as { n: number }).n,
    business_ideas:    (db.prepare(`SELECT COUNT(*) as n FROM business_ideas`).get() as { n: number }).n,
  }

  console.log('\nRecords to be deleted:')
  console.log(`  megatrends:        ${counts.megatrends}`)
  console.log(`  megatrend_signals: ${counts.megatrend_signals}`)
  console.log(`  business_ideas:    ${counts.business_ideas}`)
  console.log('\nKeeping: sources, raw_signals, pain_registry, schema\n')

  if (!force) {
    const ok = await confirm('Delete all legacy data? (y/N) ')
    if (!ok) {
      console.log('Aborted.')
      process.exit(0)
    }
  }

  db.transaction(() => {
    db.prepare(`DELETE FROM business_ideas`).run()
    db.prepare(`DELETE FROM megatrend_signals`).run()
    db.prepare(`DELETE FROM megatrends`).run()
  })()

  console.log('\nDone. All legacy megatrend data cleared.')
  console.log('Run pipeline:seed-megatrend-sources → pipeline:ingest-megatrends → pipeline:extract-megatrends to start fresh.')

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
