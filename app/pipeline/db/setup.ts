import { getDb } from './client'
import { ALL_SCHEMAS } from './schema'

export function setupDb() {
  const db = getDb()
  for (const sql of ALL_SCHEMAS) {
    db.exec(sql)
  }
  console.log('DB schema initialized')
}
