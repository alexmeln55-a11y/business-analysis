import { getDb } from './client'
import { ALL_SCHEMAS } from './schema'

const REASON_COLUMNS = [
  'structural_strength_reason',
  'demand_signal_reason',
  'longevity_reason',
  'geographic_spread_reason',
  'clarity_of_need_reason',
  'hype_risk_reason',
]

export function setupDb() {
  const db = getDb()
  for (const sql of ALL_SCHEMAS) {
    db.exec(sql)
  }
  // Migration: add reason columns to existing megatrends table
  for (const col of REASON_COLUMNS) {
    try {
      db.exec(`ALTER TABLE megatrends ADD COLUMN ${col} TEXT`)
    } catch {
      // Column already exists — ignore
    }
  }
  console.log('DB schema initialized')
}
