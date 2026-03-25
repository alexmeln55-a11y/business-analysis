import { TelegramClient } from 'telegram'
import { createClient, saveSession } from './client'
import readline from 'readline/promises'

export async function runAuth(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const client: TelegramClient = createClient()

  await client.start({
    phoneNumber: async () => {
      const phone = await rl.question('Номер телефона (+7...): ')
      return phone.trim()
    },
    phoneCode: async () => {
      const code = await rl.question('Код из Telegram: ')
      return code.trim()
    },
    password: async () => {
      const pwd = await rl.question('Пароль 2FA (Enter если нет): ')
      return pwd.trim()
    },
    onError: (err: Error) => { console.error('Auth error:', err.message) },
  })

  saveSession(client)
  console.log('Авторизация успешна. Сессия сохранена.')
  rl.close()
  await client.disconnect()
}

// Run directly: tsx pipeline/telegram/auth.ts
if (require.main === module) {
  import('dotenv').then(dotenv => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')
    dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
    dotenv.config({ path: path.join(process.cwd(), '.env') })
    dotenv.config({ path: path.join(process.cwd(), '.env.local') })
    runAuth().catch(console.error)
  })
}
