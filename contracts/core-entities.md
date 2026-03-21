# Core Entities — Overview

This file describes how core entities relate to each other.
Field definitions live in individual contract files — not here.

## Entity Map

```
FounderProfile
  └── referenced by: OpportunityCard, ScoringRun

MarketSignal (raw)
  └── normalized into: MarketSignal (normalized)
        └── referenced by: OpportunityCard (via signal_ids)

BusinessPattern
  └── referenced by: OpportunityCard (via pattern_ids)

ScoringRun
  ├── inputs: FounderProfile, MarketSignal (normalized), BusinessPattern
  └── referenced by: OpportunityCard (via scoring_run_id)

OpportunityCard
  ├── inputs: FounderProfile, MarketSignal (normalized), BusinessPattern, ScoringRun
  └── primary output entity of the platform

ValidationTest
  └── targets any contract for structural verification
```

## Flow Summary

1. Founder fills in **FounderProfile**
2. System captures **MarketSignal (raw)** from sources
3. Script normalizes raw signal into **MarketSignal (normalized)**
4. System matches **BusinessPattern** records to the signal
5. Scoring script runs, producing **ScoringRun**
6. System assembles **OpportunityCard** from all of the above

## Contract Files

All field-level definitions are in `/contracts/*.yaml`.
See [README.md](README.md) for the full contract index.
