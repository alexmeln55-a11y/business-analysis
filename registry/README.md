# Registry

Registry stores first-class project assets.
Nothing important should exist only in chat context or only inside random workflow nodes.

Folders:
- `hooks/` — trigger definitions and routing intent
- `scripts/` — deterministic actions
- `skills/` — reusable bounded capabilities
- `instructions/` — behavior and evaluation rules
- `prompts/` — versioned prompt assets
- `agents/` — agent definitions tied to workflows and schemas

Naming:
- `hook.<domain>.<purpose>.v<major>.yaml`
- `script.<domain>.<purpose>.v<major>.yaml`
- `skill.<domain>.<purpose>.v<major>.yaml`
- `instruction.<domain>.<purpose>.v<major>.yaml`
- `prompt.<domain>.<purpose>.v<major>.md`
- `agent.<domain>.<purpose>.v<major>.yaml`

Rules:
- every definition must point to explicit inputs and outputs
- every prompt must reference linked instructions and output schema
- every skill must define deterministic steps first and LLM steps second
- every agent must be tied to one owner workflow
- all versions are explicit
