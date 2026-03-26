export interface SourceRow {
  source_id: string
  source_name: string
  source_type: string
  is_active: number
  config: string      // JSON
  last_cursor: string | null
  added_at: string
  updated_at: string
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
  created_at: string
  updated_at: string
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
