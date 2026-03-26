// Deduplicates megatrends in DB using Jaccard similarity on canonical_key.
// Archives duplicates, keeps originals, updates source lists.
// Usage: npm run pipeline:normalize-megatrends

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { runNormalization } from '../megatrends/normalizer'
import { getDb } from '../db/client'

async function main() {
  const db = getDb()
  const total = (db.prepare('SELECT COUNT(*) as n FROM megatrends').get() as { n: number }).n
  console.log(`=== Normalization: ${total} megatrends in DB ===\n`)

  const { merged, kept } = runNormalization()

  console.log(`\n=== Done: ${kept} kept, ${merged} archived as duplicates ===`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
