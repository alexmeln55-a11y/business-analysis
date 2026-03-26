// Megatrend scorer — computes totalScore from 6 sub-scores.
// hypeRisk reduces the score (high hype = lower reliability).
// All inputs are on 1–10 scale.

export interface MegatrendScoreInput {
  structural_strength: number   // насколько тренд структурный, а не конъюнктурный
  demand_signal:       number   // рыночный спрос прямо сейчас
  longevity:           number   // горизонт тренда (долгосрочность)
  geographic_spread:   number   // охват: локальный vs глобальный
  clarity_of_need:     number   // насколько потребность чёткая и измеримая
  hype_risk:           number   // риск хайпа (чем выше — тем хуже)
}

export function scoreMegatrend(input: MegatrendScoreInput): number {
  const { structural_strength, demand_signal, longevity, geographic_spread, clarity_of_need, hype_risk } = input
  // All fields on 1–10 scale.
  // hype_risk is a direct penalty: higher hype = lower score.
  const raw = (structural_strength * 0.25) +
              (demand_signal       * 0.20) +
              (longevity           * 0.20) +
              (geographic_spread   * 0.15) +
              (clarity_of_need     * 0.20) -
              (hype_risk           * 0.15)
  return Math.round(Math.min(10, Math.max(0, raw)) * 10) / 10
}

/** Assign status based on totalScore (1–10 scale). */
export function statusFromScore(score: number): 'shortlist' | 'watchlist' | 'archive' {
  if (score >= 7.0) return 'shortlist'
  if (score >= 5.5) return 'watchlist'
  return 'archive'
}
