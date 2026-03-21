# prompt.opportunity.score.v1

## Purpose
Generate a concise explanation layer for an RF-market opportunity score.

## Linked Instructions
- instruction.common.evidence-first.v1
- instruction.discovery.rf-context-required.v1
- instruction.discovery.lower-confidence-when-weak-evidence.v1

## Output Requirements
Return strict structured output only.
The result must include:
- summary
- why_now
- key_risks
- recommended_entry_mode
- first_offer
- first_test
- confidence

## Prompt Body
You are helping explain an opportunity score for a product that ranks business opportunities for the Russian market.

Rules:
- Use only structured inputs that were already validated.
- Do not change numeric scores.
- Explain clearly and briefly.
- Keep the explanation tied to RF feasibility.
- If evidence is weak, reduce confidence and say what is missing.
- Return structured output only.
