// Types derived from contracts/*.yaml

export interface FounderProfile {
  id: string
  name: string
  experience_domains: string[]
  skills: Record<string, 'beginner' | 'intermediate' | 'strong' | 'expert'>
  distribution_access: string[]
  preferred_models: string[]
  time_horizon_months: number
  manual_work_tolerance: 'low' | 'medium' | 'high'
  sales_cycle_tolerance: 'short_only' | 'medium_ok' | 'long_ok'
}

export interface MarketSignal {
  id: string
  raw_signal_id: string
  audience: string
  problem: string
  current_workaround: string | null
  evidence_strength: 'anecdotal' | 'weak' | 'moderate' | 'strong'
  frequency: 'rare' | 'occasional' | 'frequent' | 'pervasive'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  normalized_at: string
}

export interface OpportunityCard {
  id: string
  title: string
  problem: string
  audience: string
  founder_profile_id: string
  signal_ids: string[]
  pattern_ids: string[]
  scoring_run_id: string
  pain_score: number
  willingness_to_pay: 'low' | 'medium' | 'high' | 'very_high'
  founder_fit_score: number
  pattern_score: number
  entry_feasibility_score: number
  overall_score: number
  confidence: number
  risks: string[]
  recommended_entry_mode: 'manual_first' | 'productized_service' | 'lightweight_saas' | 'marketplace' | 'community_led' | 'other'
  first_offer: string
  first_test: string
  created_at: string
}
