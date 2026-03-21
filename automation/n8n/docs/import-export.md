# n8n Import / Export Rules

## Core rule
Repo is the single source of truth.
Never treat the n8n UI as authoritative.

## Import process
1. Locate the workflow JSON in `/automation/n8n/workflows/`.
2. In n8n: Settings → Import workflow → select the JSON file.
3. Verify the workflow name and ID match the filename.
4. Run smoke-checks defined in `smoke-tests.md`.
5. Do not activate until smoke-checks pass.

## Export process (after any live change)
1. In n8n: open the workflow → Export → download JSON.
2. Rename file to match the workflow ID exactly (e.g. `wf.opportunity.build.v1.json`).
3. Replace the file in `/automation/n8n/workflows/`.
4. Update `notes` and version fields in the JSON if behavior changed.
5. Commit to repo.
6. Re-run smoke-checks.

## Filename convention
Workflow files must be named exactly as the workflow `id` field:
- `wf.discovery.manual-intake.v1.json`
- `wf.market-signals.normalize.v1.json`
- `wf.opportunity.build.v1.json`

## Current workflow status

| Workflow | File | Status |
|----------|------|--------|
| wf.discovery.manual-intake.v1 | wf.discovery.manual-intake.v1.json | template-only |
| wf.market-signals.normalize.v1 | wf.market-signals.normalize.v1.json | template-only |
| wf.opportunity.build.v1 | wf.opportunity.build.v1.json | template-only |

`template-only` = metadata and steps defined in repo, not yet imported into live n8n.

## Prohibited
- Editing workflows in n8n UI without exporting back to repo.
- Using the n8n UI version as the reference if it diverges from repo.
- Importing into paid n8n cloud (only self-hosted / community).
