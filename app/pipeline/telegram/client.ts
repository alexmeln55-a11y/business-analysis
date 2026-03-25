import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import fs from 'fs'
import path from 'path'

const SESSION_FILE = path.join(process.cwd(), '..', '.telegram_session')

export function loadSession(): StringSession {
  let sessionStr = ''
  if (process.env.TELEGRAM_SESSION) {
    sessionStr = process.env.TELEGRAM_SESSION
  } else if (fs.existsSync(SESSION_FILE)) {
    sessionStr = fs.readFileSync(SESSION_FILE, 'utf-8').trim()
  }
  return new StringSession(sessionStr)
}

export function saveSession(client: TelegramClient) {
  const sessionStr = client.session.save() as string
  fs.writeFileSync(SESSION_FILE, sessionStr)
  console.log('Session saved to', SESSION_FILE)
}

export function createClient(): TelegramClient {
  const apiId = parseInt(process.env.TELEGRAM_API_ID ?? '0', 10)
  const apiHash = process.env.TELEGRAM_API_HASH ?? ''

  if (!apiId || !apiHash) {
    throw new Error('TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env')
  }

  const session = loadSession()
  return new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 3,
  })
}
