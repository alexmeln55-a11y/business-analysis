# Contracts

Contracts are the stable, versioned definitions for all core data entities.
Every field has a type, required/optional status, and description.
Registry assets must reference contract IDs explicitly.

## Rules

- Contracts must be versioned (e.g. `founder-profile.v1`).
- Contracts must not be duplicated across random files.
- Registry assets reference contract IDs, not field lists.
- A contract is not active until all required fields are defined with types.
- Contract files are the single source of truth for entity shape.

## Active Contracts

| Contract ID | File | Description |
|-------------|------|-------------|
| founder-profile.v1 | [founder-profile.v1.yaml](founder-profile.v1.yaml) | Founder or user profile used for fit scoring |
| market-signal.raw.v1 | [market-signal.raw.v1.yaml](market-signal.raw.v1.yaml) | Raw unprocessed market signal at intake |
| market-signal.normalized.v1 | [market-signal.normalized.v1.yaml](market-signal.normalized.v1.yaml) | Normalized signal with extracted semantic fields |
| business-pattern.v1 | [business-pattern.v1.yaml](business-pattern.v1.yaml) | Proven business pattern evaluated for RF applicability |
| opportunity-card.v1 | [opportunity-card.v1.yaml](opportunity-card.v1.yaml) | Core output entity — scored business opportunity |
| scoring-run.v1 | [scoring-run.v1.yaml](scoring-run.v1.yaml) | Single deterministic scoring execution record |
| validation-test.v1 | [validation-test.v1.yaml](validation-test.v1.yaml) | Test case for verifying a contract definition |
| discovery-request.v1 | [discovery-request.v1.yaml](discovery-request.v1.yaml) | Raw intake request from a founder to evaluate an opportunity |
| normalized-discovery-task.v1 | [normalized-discovery-task.v1.yaml](normalized-discovery-task.v1.yaml) | Normalized routable task produced by the intake hook |
| opportunity-build-input.v1 | [opportunity-build-input.v1.yaml](opportunity-build-input.v1.yaml) | Composite input for opportunity card building (founder + signals + patterns) |
| opportunity-score-input.v1 | [opportunity-score-input.v1.yaml](opportunity-score-input.v1.yaml) | Flattened input for deterministic scoring script |

## Entity Overview

See [core-entities.md](core-entities.md) for a map of how entities relate to each other.
