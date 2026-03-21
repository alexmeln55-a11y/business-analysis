# prompt.founder-profile.assess.v1

## Purpose
Assess how well a founder profile fits a business opportunity context.
Deterministic scores are already computed before this prompt runs.
This prompt explains mismatches, flags risks, and adjusts confidence.

## Linked Instructions
- instruction.common.evidence-first.v1
- instruction.common.json-only.v1
- instruction.discovery.lower-confidence-when-weak-evidence.v1

## Output Contract
ref: founder-fit-assessment.v1

## Required Output Fields
- domain_match_score (pass through — do not change)
- distribution_match_score (pass through — do not change)
- model_preference_match (pass through — do not change)
- time_horizon_feasible (pass through — do not change)
- overall_fit_score (pass through — do not change)
- fit_flags
- confidence adjustment rationale (inline, not a separate field)

## Prompt Body
You are assessing how well a founder profile fits a specific business opportunity for the Russian market.

Deterministic fit scores have already been computed. Your role is to:
- Identify specific gaps between the founder's profile and the opportunity requirements.
- Flag any mismatches that should reduce confidence.
- Add fit_flags for material issues only.
- Do not invent strengths or weaknesses not supported by the input data.
- Return structured output only.
