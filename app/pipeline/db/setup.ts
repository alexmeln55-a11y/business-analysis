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

// Upgrade-01a: new columns for confirmation layer
const UPGRADE_01A_COLUMNS: Array<[string, string]> = [
  ['confirmation_status', "TEXT NOT NULL DEFAULT 'signal'"],
  ['signals_count',       'INTEGER NOT NULL DEFAULT 1'],
  ['sources_count',       'INTEGER NOT NULL DEFAULT 1'],
  ['unique_sources_count','INTEGER NOT NULL DEFAULT 1'],
  ['regions_count',       'INTEGER NOT NULL DEFAULT 1'],
  ['first_seen_at',       'TEXT'],
  ['last_seen_at',        'TEXT'],
  ['active_days',         'INTEGER NOT NULL DEFAULT 1'],
]

// Upgrade-01b: priority column (separate from scoring status and confirmation)
const UPGRADE_01B_COLUMNS: Array<[string, string]> = [
  ['priority', "TEXT NOT NULL DEFAULT 'medium'"],
]

// Pipeline-09: topic critic columns — soft critic gate for signal→topic promotion
const PIPELINE_09_COLUMNS: Array<[string, string]> = [
  ['topic_critic_verdict',    'TEXT'],   // 'approve' | 'reject' | NULL (not checked yet)
  ['topic_critic_reason',     'TEXT'],   // reason from soft critic
  ['topic_critic_checked_at', 'TEXT'],   // ISO datetime of last critic check
]

// Pipeline-09b: confirmed critic columns — strict critic gate for topic→confirmed_shift
const PIPELINE_09B_COLUMNS: Array<[string, string]> = [
  ['confirmed_critic_verdict',    'TEXT'],  // 'approve' | 'downgrade' | 'reject' | NULL
  ['confirmed_critic_reason',     'TEXT'],  // reason from strict critic
  ['confirmed_critic_checked_at', 'TEXT'],  // ISO datetime of last confirmed critic check
]

// Auto-01: new columns on sources table for daily run tracking
const AUTO_01_SOURCE_COLUMNS: Array<[string, string]> = [
  ['last_success_at', 'TEXT'],                           // last time fetch succeeded
  ['status',         "TEXT NOT NULL DEFAULT 'active'"],  // active | disabled | error | degraded
]

// Auto-02: health tracking — counts consecutive errors to detect permanently broken sources
const AUTO_02_SOURCE_COLUMNS: Array<[string, string]> = [
  ['consecutive_errors', 'INTEGER NOT NULL DEFAULT 0'],  // resets to 0 on any success
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
  // Migration: Upgrade-01a columns
  for (const [col, def] of UPGRADE_01A_COLUMNS) {
    try {
      db.exec(`ALTER TABLE megatrends ADD COLUMN ${col} ${def}`)
    } catch {
      // Column already exists — ignore
    }
  }
  // Migration: Upgrade-01b columns
  for (const [col, def] of UPGRADE_01B_COLUMNS) {
    try {
      db.exec(`ALTER TABLE megatrends ADD COLUMN ${col} ${def}`)
    } catch {
      // Column already exists — ignore
    }
  }
  // Migration: Pipeline-09 columns (topic critic gate)
  for (const [col, def] of PIPELINE_09_COLUMNS) {
    try {
      db.exec(`ALTER TABLE megatrends ADD COLUMN ${col} ${def}`)
    } catch {
      // Column already exists — ignore
    }
  }
  // Migration: Pipeline-09b columns (confirmed critic gate)
  for (const [col, def] of PIPELINE_09B_COLUMNS) {
    try {
      db.exec(`ALTER TABLE megatrends ADD COLUMN ${col} ${def}`)
    } catch {
      // Column already exists — ignore
    }
  }
  // Migration: Auto-01 columns on sources (daily run tracking)
  for (const [col, def] of AUTO_01_SOURCE_COLUMNS) {
    try {
      db.exec(`ALTER TABLE sources ADD COLUMN ${col} ${def}`)
    } catch {
      // Column already exists — ignore
    }
  }
  // Migration: Auto-02 columns on sources (health tracking)
  for (const [col, def] of AUTO_02_SOURCE_COLUMNS) {
    try {
      db.exec(`ALTER TABLE sources ADD COLUMN ${col} ${def}`)
    } catch {
      // Column already exists — ignore
    }
  }
  console.log('DB schema initialized')
}
