// SQL schema strings for all pipeline tables

export const SCHEMA_SOURCES = `
CREATE TABLE IF NOT EXISTS sources (
  source_id   TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'telegram',
  is_active   INTEGER NOT NULL DEFAULT 1,
  config      TEXT NOT NULL DEFAULT '{}',
  last_cursor TEXT,
  added_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);`

export const SCHEMA_RAW_SIGNALS = `
CREATE TABLE IF NOT EXISTS raw_signals (
  signal_id   TEXT PRIMARY KEY,
  source_id   TEXT NOT NULL,
  external_id TEXT NOT NULL,
  raw_text    TEXT NOT NULL,
  url         TEXT,
  author      TEXT,
  date        TEXT NOT NULL,
  hash        TEXT NOT NULL UNIQUE,
  metadata    TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);`

export const SCHEMA_CANDIDATE_PAINS = `
CREATE TABLE IF NOT EXISTS candidate_pains (
  candidate_id          TEXT PRIMARY KEY,
  signal_id             TEXT NOT NULL,
  topic_id              TEXT NOT NULL,
  segment               TEXT,
  pain                  TEXT NOT NULL,
  context               TEXT,
  workaround            TEXT,
  consequence           TEXT,
  extraction_confidence REAL NOT NULL DEFAULT 0.5,
  extraction_status     TEXT NOT NULL DEFAULT 'pending',
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);`

export const SCHEMA_PAIN_REGISTRY = `
CREATE TABLE IF NOT EXISTS pain_registry (
  pain_id           TEXT PRIMARY KEY,
  topic_id          TEXT NOT NULL,
  vertical          TEXT NOT NULL DEFAULT '',
  segment           TEXT NOT NULL,
  title             TEXT NOT NULL,
  short_description TEXT NOT NULL,
  full_description  TEXT,
  target_who        TEXT,
  context           TEXT,
  workaround        TEXT,
  consequences      TEXT,
  evidence_count    INTEGER NOT NULL DEFAULT 1,
  market_pain_score REAL NOT NULL DEFAULT 5.0,
  source_types      TEXT NOT NULL DEFAULT '["telegram"]',
  last_seen_at      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'new',
  tags              TEXT NOT NULL DEFAULT '[]',
  score_breakdown   TEXT NOT NULL DEFAULT '{}',
  evidence_summary  TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);`

export const SCHEMA_MEGATRENDS = `
CREATE TABLE IF NOT EXISTS megatrends (
  id                  TEXT PRIMARY KEY,
  title               TEXT NOT NULL,
  summary             TEXT NOT NULL,
  why_growing         TEXT,
  time_horizon        TEXT,
  geography           TEXT,
  vertical            TEXT NOT NULL DEFAULT '',
  source_name         TEXT,
  source_url          TEXT,
  structural_strength        REAL NOT NULL DEFAULT 5.0,
  demand_signal              REAL NOT NULL DEFAULT 5.0,
  longevity                  REAL NOT NULL DEFAULT 5.0,
  geographic_spread          REAL NOT NULL DEFAULT 5.0,
  clarity_of_need            REAL NOT NULL DEFAULT 5.0,
  hype_risk                  REAL NOT NULL DEFAULT 3.0,
  total_score                REAL NOT NULL DEFAULT 5.0,
  structural_strength_reason TEXT,
  demand_signal_reason       TEXT,
  longevity_reason           TEXT,
  geographic_spread_reason   TEXT,
  clarity_of_need_reason     TEXT,
  hype_risk_reason           TEXT,
  status                     TEXT NOT NULL DEFAULT 'new',
  canonical_key              TEXT,
  -- Upgrade-01a: confirmation layer (separate from scoring status)
  confirmation_status        TEXT NOT NULL DEFAULT 'signal',
  signals_count              INTEGER NOT NULL DEFAULT 1,
  sources_count              INTEGER NOT NULL DEFAULT 1,
  unique_sources_count       INTEGER NOT NULL DEFAULT 1,
  regions_count              INTEGER NOT NULL DEFAULT 1,
  first_seen_at              TEXT,
  last_seen_at               TEXT,
  active_days                INTEGER NOT NULL DEFAULT 1,
  created_at                 TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                 TEXT NOT NULL DEFAULT (datetime('now'))
);`

// Signals: one row per article/publication (Upgrade-01a)
// A signal is the atomic unit — it becomes a megatrend candidate only after accumulation.
export const SCHEMA_MEGATREND_SIGNALS = `
CREATE TABLE IF NOT EXISTS megatrend_signals (
  id            TEXT PRIMARY KEY,
  megatrend_id  TEXT,             -- linked after clustering (NULL until linked)
  title         TEXT NOT NULL,
  summary       TEXT NOT NULL,
  source_name   TEXT NOT NULL,
  source_url    TEXT,
  published_at  TEXT NOT NULL,    -- original article date, used for freshness gate
  region        TEXT,
  vertical      TEXT,
  raw_text      TEXT,
  confidence    REAL NOT NULL DEFAULT 0.7,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);`

// Business ideas — generated from confirmed_shift topics (Shifts-01)
export const SCHEMA_BUSINESS_IDEAS = `
CREATE TABLE IF NOT EXISTS business_ideas (
  id           TEXT PRIMARY KEY,
  shift_id     TEXT NOT NULL,    -- links to megatrends.id (confirmed_shift)
  title        TEXT NOT NULL,
  summary      TEXT NOT NULL,
  target_user  TEXT,
  problem      TEXT,
  why_now      TEXT,
  simple_entry TEXT,
  confidence   REAL NOT NULL DEFAULT 0.7,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);`

// Auto-01: one row per source per daily run — tracks what was fetched and what changed
export const SCHEMA_SOURCE_RUNS = `
CREATE TABLE IF NOT EXISTS source_runs (
  id               TEXT PRIMARY KEY,
  source_id        TEXT NOT NULL,
  started_at       TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at      TEXT,
  status           TEXT NOT NULL DEFAULT 'running',  -- running | success | error | skipped
  total_found      INTEGER NOT NULL DEFAULT 0,
  new_found        INTEGER NOT NULL DEFAULT 0,
  duplicates_found INTEGER NOT NULL DEFAULT 0,
  error_message    TEXT
);`

export const ALL_SCHEMAS = [
  SCHEMA_SOURCES,
  SCHEMA_RAW_SIGNALS,
  SCHEMA_CANDIDATE_PAINS,
  SCHEMA_PAIN_REGISTRY,
  SCHEMA_MEGATRENDS,
  SCHEMA_MEGATREND_SIGNALS,
  SCHEMA_BUSINESS_IDEAS,
  SCHEMA_SOURCE_RUNS,
]
