import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { runExtraction } from '../extraction/extractor'

async function main() {
  await runExtraction(100)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
