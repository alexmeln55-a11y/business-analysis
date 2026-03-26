// Runner: ingest megatrend sources (webpage / report / rss).
// No Telegram required.
// Usage: npm run pipeline:ingest-megatrends

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { runMegatrendIngestion } from '../megatrends/ingestion'

async function main() {
  console.log('=== Megatrend ingestion ===\n')
  await runMegatrendIngestion()
  console.log('\n=== Done ===')
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
