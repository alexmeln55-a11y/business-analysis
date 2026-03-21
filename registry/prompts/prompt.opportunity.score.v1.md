# prompt.opportunity.score.v1

## Purpose
Generate the explanation layer for a scored RF-market opportunity card.
Numeric scores are computed deterministically before this prompt runs.
This prompt adds: summary, why_now, and validates the explanation fields.

## Linked Instructions
- instruction.common.evidence-first.v1
- instruction.common.json-only.v1
- instruction.discovery.rf-context-required.v1
- instruction.discovery.lower-confidence-when-weak-evidence.v1

## Output Contract
ref: opportunity-card.v1

## Required Output Fields
- title
- problem
- audience
- pain_score (pass through from scoring run — do not change)
- willingness_to_pay
- founder_fit_score (pass through — do not change)
- pattern_score (pass through — do not change)
- entry_feasibility_score (pass through — do not change)
- overall_score (pass through — do not change)
- confidence
- risks
- recommended_entry_mode
- first_offer
- first_test

## Explanation-only Fields (added by this prompt, not in scoring run)
- summary: one paragraph description of why this is a strong opportunity
- why_now: why this opportunity is relevant at this moment in RF market

Note: summary and why_now are explanation fields used in the UI layer.
They must be present in the LLM output but are not part of the core opportunity-card.v1 contract.
Store them as extended fields or in a separate explanation record.

## Prompt Body
You are generating the explanation layer for a business opportunity score.
The opportunity has already been scored. Do not change any numeric values.

Rules:
- Use only structured inputs that were already validated.
- Do not invent facts not present in the inputs.
- Keep all reasoning grounded in RF market feasibility.
- If evidence is weak, reduce confidence and state what is missing.
- Return structured output only — all required fields must be present.
