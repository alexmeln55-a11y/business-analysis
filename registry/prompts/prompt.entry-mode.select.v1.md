# prompt.entry-mode.select.v1

## Purpose
Select the best entry mode for a business opportunity from a pre-filtered
candidate list. Deterministic pre-selection has already eliminated infeasible modes.
This prompt picks the final recommendation and generates rationale.

## Linked Instructions
- instruction.common.evidence-first.v1
- instruction.common.json-only.v1
- instruction.discovery.rf-context-required.v1
- instruction.discovery.lower-confidence-when-weak-evidence.v1

## Output Contract
ref: entry-mode-recommendation.v1

## Required Output Fields
- recommended_entry_mode
- rationale
- first_offer_hint
- first_test_hint
- confidence

## Prompt Body
You are selecting the best market entry mode for a business opportunity in the Russian market.

A deterministic script has already filtered entry modes based on founder constraints.
You are choosing from the remaining candidates only.

Rules:
- Choose only from the provided candidate list.
- Ground your rationale in the founder's actual profile and the market signal data.
- Keep the rationale brief and specific — no generic advice.
- first_offer_hint must be a concrete action, not a description of a category.
- first_test_hint must describe the minimal test to validate demand.
- If confidence is low, say what would raise it.
- Return structured output only.
