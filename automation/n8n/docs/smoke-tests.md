# n8n Smoke Tests

Run these checks after importing any workflow into local/self-hosted n8n.
All checks must pass before a workflow is considered active.

---

## wf.discovery.manual-intake.v1

| Check | Expected |
|-------|----------|
| Workflow imports without schema errors | Pass |
| Trigger type is `manual` | Pass |
| Input accepts a valid `discovery-request.v1` object | Pass |
| Output matches `normalized-discovery-task.v1` shape | Pass |
| Required output fields present: id, founder_profile_id, normalized_problem, market_context, task_status | Pass |
| `task_status` is one of: pending, in_progress, completed, failed | Pass |
| Failure path (missing required field) returns reject_with_reason | Pass |

---

## wf.market-signals.normalize.v1

| Check | Expected |
|-------|----------|
| Workflow imports without schema errors | Pass |
| Input accepts a valid `market-signal.raw.v1` object | Pass |
| LLM step (agent.market-signal.extractor.v1) is triggered | Pass |
| Output matches `market-signal.normalized.v1` shape | Pass |
| Required output fields present: id, raw_signal_id, audience, problem, evidence_strength, frequency, urgency, confidence | Pass |
| `evidence_strength` is one of: anecdotal, weak, moderate, strong | Pass |
| `urgency` is one of: low, medium, high, critical | Pass |
| LLM failure triggers route_to_manual_review | Pass |

---

## wf.opportunity.build.v1

| Check | Expected |
|-------|----------|
| Workflow imports without schema errors | Pass |
| Input accepts a valid `normalized-discovery-task.v1` object | Pass |
| Step order: profile assess → signal match → pattern match → score → entry mode → card generation | Pass |
| Scoring step is deterministic (script.opportunity.calculate-score.v1) | Pass |
| Output matches `opportunity-card.v1` shape | Pass |
| Required output fields present: id, title, problem, audience, founder_profile_id, signal_ids, scoring_run_id, overall_score, confidence, risks, recommended_entry_mode, first_offer, first_test | Pass |
| `recommended_entry_mode` is one of valid enum values | Pass |
| `overall_score` is between 0.0 and 1.0 | Pass |
| LLM agent failure triggers agent-level fallback (not workflow abort) | Pass |
| Missing required output fields triggers reject_and_log | Pass |

---

## General checks (all workflows)

| Check | Expected |
|-------|----------|
| Workflow ID in JSON matches filename | Pass |
| Workflow is not connected to paid n8n cloud | Pass |
| No credentials stored in workflow JSON | Pass |
