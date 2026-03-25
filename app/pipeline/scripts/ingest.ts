import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { createClient } from '../telegram/client'
import { runIngestion } from '../telegram/ingestion'

async function main() {
  const client = createClient()
  await client.connect()
  await runIngestion(client)
  await client.disconnect()
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
