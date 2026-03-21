# Repo Map

## Purpose
Single reference for what exists where and why.
If something is not in this map and not in the repo, it does not exist.

---

## Top-level structure

```
/CLAUDE.md              — project memory, operating rules, working mode
/README.md              — brief project intro
/plan/                  — strategy, requirements, chunk plan, operating rules
/contracts/             — versioned data entity definitions (source of truth for shapes)
/registry/              — hooks, scripts, skills, instructions, prompts, agents
/automation/n8n/        — workflow templates, n8n docs, agent bindings
/docs/                  — UI kit, page templates, supporting product docs
/scripts/               — helper scripts and examples
```

---

## /plan

| File | Purpose |
|------|---------|
| requirements.md | Business, product, and system requirements |
| strategy.md | Product thesis, core entities, MVP architecture |
| chunks.md | Implementation chunk plan with done criteria |
| n8n.md | n8n rules, workflow rules, agent rules |
| operating-rules.md | Session rules, git rules, rollback mindset |
| prompts.md | Prompt templates for Claude Code sessions |

---

## /contracts

Versioned YAML definitions for all data entities.
Every field has a type, required/optional status, and description.
Registry assets must reference contract IDs from this directory.

| Contract ID | File | Description |
|-------------|------|-------------|
| founder-profile.v1 | founder-profile.v1.yaml | Founder profile — input to fit scoring |
| market-signal.raw.v1 | market-signal.raw.v1.yaml | Raw unprocessed market signal |
| market-signal.normalized.v1 | market-signal.normalized.v1.yaml | Normalized signal with scored fields |
| business-pattern.v1 | business-pattern.v1.yaml | Proven business pattern for RF evaluation |
| opportunity-card.v1 | opportunity-card.v1.yaml | Core output entity — scored opportunity |
| scoring-run.v1 | scoring-run.v1.yaml | Deterministic scoring execution record |
| validation-test.v1 | validation-test.v1.yaml | Test case for contract verification |
| discovery-request.v1 | discovery-request.v1.yaml | Raw intake request from founder |
| normalized-discovery-task.v1 | normalized-discovery-task.v1.yaml | Routable task from intake hook |
| opportunity-build-input.v1 | opportunity-build-input.v1.yaml | Composite input for opportunity building |
| opportunity-score-input.v1 | opportunity-score-input.v1.yaml | Flattened input for scoring script |
| founder-fit-assessment.v1 | founder-fit-assessment.v1.yaml | Output of profile assess skill |
| entry-mode-recommendation.v1 | entry-mode-recommendation.v1.yaml | Output of entry mode selector skill |

See contracts/README.md for rules and full index.

---

## /registry

First-class project assets. Naming: `<type>.<domain>.<purpose>.v<major>.<ext>`

### hooks/
Trigger definitions and routing intent.
- hook.discovery.manual-intake.v1.yaml

### scripts/
Deterministic actions — no hidden LLM logic.
- script.market-signal.normalize.v1.yaml
- script.opportunity.calculate-score.v1.yaml
- script.founder-profile.validate.v1.yaml
- script.entry-mode.preselect.v1.yaml

### skills/
Reusable bounded capabilities (deterministic first, LLM second).
- skill.market-signal.extractor.v1.yaml
- skill.opportunity.scorer.v1.yaml
- skill.profile.assess.v1.yaml
- skill.entry-mode.selector.v1.yaml

### instructions/
Behavior constraints and evaluation policies applied to LLM steps.
- instruction.common.evidence-first.v1.yaml
- instruction.common.json-only.v1.yaml
- instruction.common.no-invention.v1.yaml
- instruction.common.validate-required-fields.v1.yaml
- instruction.discovery.rf-context-required.v1.yaml
- instruction.discovery.lower-confidence-when-weak-evidence.v1.yaml

### prompts/
Versioned LLM prompt templates, each tied to a skill and output contract.
- prompt.market-signal.extract.v1.md
- prompt.opportunity.score.v1.md
- prompt.founder-profile.assess.v1.md
- prompt.entry-mode.select.v1.md

### agents/
Agent definitions — each tied to one owner workflow and one output contract.
- agent.market-signal.extractor.v1.yaml
- agent.opportunity.scorer.v1.yaml
- agent.founder-profile.assessor.v1.yaml
- agent.entry-mode.selector.v1.yaml

---

## /automation/n8n

Workflow templates and documentation for local/self-hosted n8n.
No live n8n access at this stage — all files are repo-managed templates.

### workflows/
- wf.discovery.manual-intake.v1.json
- wf.market-signals.normalize.v1.json
- wf.opportunity.build.v1.json

### docs/
- setup.md — local setup rules and live access policy
- import-export.md — import/export rules
- smoke-tests.md — minimum smoke-check criteria

### agents/
- README.md — binding rules between registry agents and n8n workflows

---

## /docs

UI and product supporting documentation.

| File | Purpose |
|------|---------|
| ui-principles.md | Visual style rules — warm dark editorial |
| ui-tokens.md | Design tokens — colors, spacing, radius, shadows |
| page-templates.md | Screen-level layout and component descriptions |
| repo-map.md | This file |

---

## /scripts

Helper scripts and examples. Not production scripts.
- deploy-n8n.example.cmd — example deploy command
- smoke-test.example.cmd — example smoke-test command
- README.md — scripts directory rules
