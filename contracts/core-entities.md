# Core Entities — Overview

This file describes how core entities relate to each other.
Field definitions live in individual contract files — not here.

## Entity Map

```
DiscoveryRequest
  └── normalized into: NormalizedDiscoveryTask
        └── triggers: wf.opportunity.build.v1

FounderProfile
  ├── assessed into: FounderFitAssessment
  └── referenced by: OpportunityCard, ScoringRun, OpportunityBuildInput

MarketSignal (raw)
  └── normalized into: MarketSignal (normalized)
        └── referenced by: OpportunityBuildInput (via signal_ids)

BusinessPattern
  └── referenced by: OpportunityBuildInput (via pattern_ids)

OpportunityBuildInput
  ├── inputs: FounderProfile, MarketSignal (normalized), BusinessPattern
  └── derived into: OpportunityScoreInput

OpportunityScoreInput
  └── scored into: ScoringRun

FounderFitAssessment
  └── feeds into: ScoringRun (founder_fit_score)

EntryModeRecommendation
  ├── input: OpportunityScoreInput
  └── feeds into: OpportunityCard (recommended_entry_mode)

ScoringRun
  ├── inputs: OpportunityScoreInput
  └── referenced by: OpportunityCard (via scoring_run_id)

OpportunityCard
  ├── inputs: FounderProfile, MarketSignal (normalized), BusinessPattern,
  │           ScoringRun, FounderFitAssessment, EntryModeRecommendation
  └── primary output entity of the platform

ValidationTest
  └── targets any contract for structural verification
```

## Flow Summary

1. Founder fills in **FounderProfile**
2. Founder submits **DiscoveryRequest**
3. Hook normalizes it into **NormalizedDiscoveryTask**, routes to workflow
4. System assesses founder → **FounderFitAssessment**
5. System captures and normalizes **MarketSignal (raw)** → **MarketSignal (normalized)**
6. System matches **BusinessPattern** records
7. System assembles **OpportunityBuildInput**, derives **OpportunityScoreInput**
8. Scoring script runs deterministically → **ScoringRun**
9. Entry mode selector runs → **EntryModeRecommendation**
10. System assembles final **OpportunityCard**

## Scoring formula
See `docs/scoring-v1.md` for component weights, penalties, and thresholds.

## Contract Files

All field-level definitions are in `/contracts/*.yaml`.
See [README.md](README.md) for the full contract index.
