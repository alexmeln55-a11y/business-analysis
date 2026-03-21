# prompt.market-signal.extract.v1

## Purpose
Extract a structured RF-market market signal from raw text.

## Linked Instructions
- instruction.common.evidence-first.v1
- instruction.common.json-only.v1

## Output Requirements
Return strict structured output only.
Required fields:
- audience
- problem
- current_workaround
- evidence_strength
- frequency
- urgency
- confidence

## Prompt Body
You are extracting a structured market signal for a business opportunity discovery system focused on the Russian market.

Rules:
- Use only the provided input.
- Do not invent missing facts.
- If evidence is weak, say so through lower confidence.
- Return strict structured output only.
