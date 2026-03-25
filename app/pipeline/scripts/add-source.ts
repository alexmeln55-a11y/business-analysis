import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { getDb } from '../db/client'
import crypto from 'crypto'

const [,, username, name, topicHint] = process.argv

if (!username || !name) {
  console.log('Usage: tsx pipeline/scripts/add-source.ts <username> <name> [topic_hint]')
  console.log('Example: tsx pipeline/scripts/add-source.ts logistika_ru "Логистика RU" transport_logistics')
  process.exit(1)
}

const db = getDb()
const sourceId = crypto.randomUUID()

db.prepare(`
  INSERT INTO sources (source_id, source_name, source_type, config)
  VALUES (?, ?, 'telegram', ?)
`).run(sourceId, name, JSON.stringify({ username: username.replace('@', ''), topic_hint: topicHint ?? null }))

console.log(`Source added: ${name} (@${username}) — id: ${sourceId}`)
process.exit(0)
