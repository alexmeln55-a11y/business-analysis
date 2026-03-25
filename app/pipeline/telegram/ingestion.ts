import { TelegramClient } from 'telegram'
import { Api } from 'telegram'
import crypto from 'crypto'
import { getDb } from '../db/client'
import type { SourceRow } from '../types'

export async function ingestSource(
  client: TelegramClient,
  source: SourceRow,
  limit = 200
): Promise<number> {
  const db = getDb()
  const config = JSON.parse(source.config) as { username: string }

  console.log(`Ingesting ${source.source_name} (@${config.username})...`)

  let entity
  try {
    entity = await client.getEntity(config.username)
  } catch (err) {
    console.error(`  Cannot resolve @${config.username}:`, err)
    return 0
  }

  const messages = await client.getMessages(entity, {
    limit,
    offsetId: source.last_cursor ? parseInt(source.last_cursor, 10) : 0,
  })

  if (!messages.length) {
    console.log(`  No new messages`)
    return 0
  }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO raw_signals
      (signal_id, source_id, external_id, raw_text, url, author, date, hash, metadata)
    VALUES
      (@signal_id, @source_id, @external_id, @raw_text, @url, @author, @date, @hash, @metadata)
  `)

  const updateCursor = db.prepare(`
    UPDATE sources SET last_cursor = @cursor, updated_at = datetime('now') WHERE source_id = @source_id
  `)

  let saved = 0
  const batchInsert = db.transaction((msgs: Api.Message[]) => {
    for (const msg of msgs) {
      if (!msg.message || msg.message.length < 30) continue

      const text = msg.message
      const hash = crypto.createHash('sha256').update(text).digest('hex')
      const signalId = crypto.randomUUID()

      insert.run({
        signal_id: signalId,
        source_id: source.source_id,
        external_id: String(msg.id),
        raw_text: text,
        url: `https://t.me/${config.username}/${msg.id}`,
        author: null,
        date: new Date(msg.date * 1000).toISOString(),
        hash,
        metadata: JSON.stringify({ views: (msg as any).views ?? null }),
      })
      saved++
    }
  })

  batchInsert(messages as Api.Message[])

  const maxId = Math.max(...(messages as Api.Message[]).map((m: Api.Message) => m.id))
  updateCursor.run({ cursor: String(maxId), source_id: source.source_id })

  console.log(`  Saved ${saved} new signals`)
  return saved
}

export async function runIngestion(client: TelegramClient): Promise<void> {
  const db = getDb()
  const sources = db.prepare(`SELECT * FROM sources WHERE is_active = 1 AND source_type = 'telegram'`).all() as SourceRow[]

  if (!sources.length) {
    console.log('No active sources. Add sources to the sources table first.')
    return
  }

  for (const source of sources) {
    await ingestSource(client, source)
  }
}
