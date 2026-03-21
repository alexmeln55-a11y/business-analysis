# Core Entities v1

## FounderProfile
- id
- name
- experience_domains[]
- skills{}
- distribution_access[]
- preferred_models[]
- time_horizon_months
- manual_work_tolerance
- sales_cycle_tolerance

## MarketSignal
- id
- source_type
- raw_text
- audience
- problem
- current_workaround
- evidence_strength
- frequency
- urgency
- confidence

## BusinessPattern
- id
- pattern_name
- problem_type
- target_segment
- entry_wedge
- monetization
- portability_score
- complexity_score

## OpportunityCard
- id
- title
- problem
- audience
- pain_score
- willingness_to_pay
- founder_fit_score
- pattern_score
- entry_feasibility_score
- risks[]
- recommended_entry_mode
- first_offer
- first_test
- overall_score
- confidence

## ScoringRun
- id
- opportunity_id
- market_score
- founder_fit_score
- pattern_score
- entry_feasibility_score
- penalty_score
- formula_version
- final_score
