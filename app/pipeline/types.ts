export interface SourceRow {
  source_id: string
  source_name: string
  source_type: string
  is_active: number
  config: string      // JSON
  last_cursor: string | null
  // Auto-01
  last_success_at: string | null
  status: 'active' | 'disabled' | 'error' | 'degraded'
  // Auto-02
  consecutive_errors: number
  added_at: string
  updated_at: string
}

// Auto-01: one row per source per daily run
export interface SourceRunRow {
  id: string
  source_id: string
  started_at: string
  finished_at: string | null
  status: 'running' | 'success' | 'error' | 'skipped'
  total_found: number
  new_found: number
  duplicates_found: number
  error_message: string | null
}

export interface RawSignalRow {
  signal_id: string
  source_id: string
  external_id: string
  raw_text: string
  url: string | null
  author: string | null
  date: string
  hash: string
  metadata: string    // JSON
  created_at: string
}

export interface CandidatePainRow {
  candidate_id: string
  signal_id: string
  topic_id: string
  segment: string | null
  pain: string
  context: string | null
  workaround: string | null
  consequence: string | null
  extraction_confidence: number
  extraction_status: string
  created_at: string
}

// Rules-01: exactly three active statuses.
// Legacy DB values ('candidate', 'confirmed') are removed by the recalculate-statuses script.
// The DB may still have legacy values until that script runs — use string where needed.
export type ConfirmationStatus = 'signal' | 'topic' | 'confirmed_shift'
export type Priority = 'high' | 'medium' | 'low'

export interface MegatrendRow {
  id: string
  title: string
  summary: string
  why_growing: string | null
  time_horizon: string | null
  geography: string | null
  vertical: string
  source_name: string | null
  source_url: string | null
  structural_strength: number
  demand_signal: number
  longevity: number
  geographic_spread: number
  clarity_of_need: number
  hype_risk: number
  total_score: number
  structural_strength_reason: string | null
  demand_signal_reason: string | null
  longevity_reason: string | null
  geographic_spread_reason: string | null
  clarity_of_need_reason: string | null
  hype_risk_reason: string | null
  status: string
  canonical_key: string | null
  // Upgrade-01a
  confirmation_status: ConfirmationStatus | 'candidate' | 'confirmed'  // DB may have legacy values pre-Rules-01
  // Upgrade-01b
  priority: Priority
  signals_count: number
  sources_count: number
  unique_sources_count: number
  regions_count: number
  first_seen_at: string | null
  last_seen_at: string | null
  active_days: number
  // Pipeline-09: topic critic gate
  topic_critic_verdict: 'approve' | 'reject' | null
  topic_critic_reason: string | null
  topic_critic_checked_at: string | null
  // Pipeline-09b: confirmed critic gate
  confirmed_critic_verdict: 'approve' | 'downgrade' | 'reject' | null
  confirmed_critic_reason: string | null
  confirmed_critic_checked_at: string | null
  created_at: string
  updated_at: string
}

// Upgrade-01a: atomic article-level signal before clustering into a megatrend
export interface MegatrendSignalRow {
  id: string
  megatrend_id: string | null
  title: string
  summary: string
  source_name: string
  source_url: string | null
  published_at: string
  region: string | null
  vertical: string | null
  raw_text: string | null
  confidence: number
  created_at: string
}

// Shifts-01: business idea linked to a confirmed_shift topic
export interface BusinessIdeaRow {
  id: string
  shift_id: string
  title: string
  summary: string
  target_user: string | null
  problem: string | null
  why_now: string | null
  simple_entry: string | null
  confidence: number
  created_at: string
}

export interface PainRegistryRow {
  pain_id: string
  topic_id: string
  vertical: string
  segment: string
  title: string
  short_description: string
  full_description: string | null
  target_who: string | null
  context: string | null
  workaround: string | null
  consequences: string | null
  evidence_count: number
  market_pain_score: number
  source_types: string   // JSON
  last_seen_at: string
  status: string
  tags: string           // JSON
  score_breakdown: string // JSON
  evidence_summary: string | null
  created_at: string
  updated_at: string
}
