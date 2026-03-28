// status-rules.ts — Rules-01
//
// Single source of truth for all confirmation_status transition rules.
// Both pipeline scripts and the site must use only these rules.
// Do NOT duplicate or override thresholds elsewhere.
//
// Lifecycle:  signal → topic → confirmed_shift
// Active statuses: exactly three. Legacy values ('candidate', 'confirmed')
// are cleaned up by the recalculate-statuses script.

export type ConfirmationStatusActive = 'signal' | 'topic' | 'confirmed_shift'

// ── Numeric thresholds ─────────────────────────────────────────────────────────

// signal → topic: Path A (strong numeric evidence — no soft critic wait)
export const TOPIC_PATH_A = {
  minUniqueSources: 3,
  minActiveDays:    30,
} as const

// signal → topic: Path B (temporal spread — soft critic validates in dedup step)
export const TOPIC_PATH_B = {
  minUniqueSources: 2,
  minActiveDays:    7,
} as const

// topic → confirmed_shift: numeric gate — topic must pass this BEFORE the strict critic runs
export const CONFIRMED_SHIFT_PREFILTER = {
  minUniqueSources: 3,
  minActiveDays:    30,
} as const

// confirmed_shift Path A: high-confidence shift
export const CONFIRMED_SHIFT_PATH_A = {
  minUniqueSources: 5,
  minActiveDays:    90,
  minActiveMonths:  2,
} as const

// confirmed_shift Path B: long-running shift
export const CONFIRMED_SHIFT_PATH_B = {
  minUniqueSources: 3,
  minActiveDays:    60,
} as const

// ── Status derivation — used by recalculateMegatrendMetrics ───────────────────
//
// Rules:
//   - confirmed_shift is NEVER set here; only the semantic checker can set it.
//   - confirmed_shift records are PROTECTED from numeric downgrade here.
//   - Volume-only promotion (many signals, one source) is intentionally absent.
//     10 signals from one source ≠ 10 independent sources.

export function deriveConfirmationStatus(
  uniqueSourcesCount: number,
  current: string,           // current DB value; protected if 'confirmed_shift'
  _signalsCount: number = 0, // unused — kept for call-site compat
  activeDays: number = 1,
): ConfirmationStatusActive {
  if (current === 'confirmed_shift') return 'confirmed_shift'
  // Path A: strong — no critic needed at numeric step
  if (uniqueSourcesCount >= TOPIC_PATH_A.minUniqueSources && activeDays >= TOPIC_PATH_A.minActiveDays) return 'topic'
  // Path B: temporal spread — dedup soft critic will validate
  if (uniqueSourcesCount >= TOPIC_PATH_B.minUniqueSources && activeDays >= TOPIC_PATH_B.minActiveDays) return 'topic'
  return 'signal'
}

// ── Confirmed_shift pre-filter check ──────────────────────────────────────────
//
// Topics that don't pass this check stay as topics.
// They need more data before the strict critic is called — not LLM evaluation.

export function meetsConfirmedShiftPrefilter(
  uniqueSourcesCount: number,
  activeDays: number,
): boolean {
  return (
    uniqueSourcesCount >= CONFIRMED_SHIFT_PREFILTER.minUniqueSources &&
    activeDays         >= CONFIRMED_SHIFT_PREFILTER.minActiveDays
  )
}

// ── Status derivation for DB rescore (Rules-01) ───────────────────────────────
//
// Unlike deriveConfirmationStatus, this function also recalculates confirmed_shift:
//   - Keeps confirmed_shift ONLY if the numeric pre-filter is still met
//   - Downgrades 'confirmed', 'candidate', and under-evidenced confirmed_shift
//
// Use ONLY in the recalculate-statuses rescore script.

export function deriveStatusForRecalculation(
  uniqueSourcesCount: number,
  activeDays: number,
  currentStatus: string,
): ConfirmationStatusActive {
  // Keep confirmed_shift only if it still meets the numeric pre-filter
  if (
    currentStatus === 'confirmed_shift' &&
    meetsConfirmedShiftPrefilter(uniqueSourcesCount, activeDays)
  ) {
    return 'confirmed_shift'
  }
  // All other cases — including legacy 'confirmed', 'candidate', and
  // confirmed_shift records that now fail the pre-filter:
  if (uniqueSourcesCount >= TOPIC_PATH_A.minUniqueSources && activeDays >= TOPIC_PATH_A.minActiveDays) return 'topic'
  if (uniqueSourcesCount >= TOPIC_PATH_B.minUniqueSources && activeDays >= TOPIC_PATH_B.minActiveDays) return 'topic'
  return 'signal'
}
