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
