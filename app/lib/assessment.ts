// Shared types and constants for assessment module.
// Imported by founder-intake, ese, hexaco, values, identity, and overview pages.

// ── Block 1: Founder Intake ───────────────────────────────────

export interface FounderIntakeAnswers {
  q1: string; q2: string; q3: string; q4: string
  q5: string; q6: string; q7: string; q8: string
  q9: string; q10: string; q11: string; q12: string
  q13: string; q14: string; q15: string; q16: string
}

export const INTAKE_STORAGE_KEY = 'founder_intake_v1'

// ── Block 2: ESE ─────────────────────────────────────────────

export interface ESEAnswers {
  q1: number; q2: number; q3: number
  q4: number; q5: number; q6: number
  q7: number; q8: number; q9: number
  q10: number; q11: number; q12: number
  q13: number; q14: number; q15: number
}

export interface ESEScores {
  opportunity_search: number
  planning: number
  resource_mobilization: number
  people_execution: number
  finance_market_execution: number
  overall: number
}

export const ESE_STORAGE_KEY = 'ese_v1'

export function calcESEScores(a: ESEAnswers): ESEScores {
  const avg = (...vals: number[]) => {
    const filled = vals.filter(v => v > 0)
    return filled.length ? filled.reduce((s, v) => s + v, 0) / filled.length : 0
  }
  const phases = [
    avg(a.q1, a.q2, a.q3),
    avg(a.q4, a.q5, a.q6),
    avg(a.q7, a.q8, a.q9),
    avg(a.q10, a.q11, a.q12),
    avg(a.q13, a.q14, a.q15),
  ]
  return {
    opportunity_search: phases[0],
    planning: phases[1],
    resource_mobilization: phases[2],
    people_execution: phases[3],
    finance_market_execution: phases[4],
    overall: avg(...phases.filter(v => v > 0)),
  }
}

// ── Block 3: HEXACO ───────────────────────────────────────────

export interface HEXACOAnswers {
  // Честность–Смиренность
  q1: number; q2: number; q3: number; q4: number
  // Эмоциональность (q8 — reversed)
  q5: number; q6: number; q7: number; q8: number
  // Экстраверсия
  q9: number; q10: number; q11: number; q12: number
  // Доброжелательность
  q13: number; q14: number; q15: number; q16: number
  // Добросовестность
  q17: number; q18: number; q19: number; q20: number
  // Открытость к опыту
  q21: number; q22: number; q23: number; q24: number
}

export interface HEXACOScores {
  honesty_humility: number
  emotionality: number
  extraversion: number
  agreeableness: number
  conscientiousness: number
  openness_to_experience: number
  overall: number
}

export const HEXACO_STORAGE_KEY = 'hexaco_v1'

export function calcHEXACOScores(a: HEXACOAnswers): HEXACOScores {
  const avg = (...vals: number[]) => {
    const filled = vals.filter(v => v > 0)
    return filled.length ? filled.reduce((s, v) => s + v, 0) / filled.length : 0
  }
  // q8 is reverse-scored for 1–5 scale: reversed = 6 - answer
  const q8r = a.q8 > 0 ? 6 - a.q8 : 0
  const factors = [
    avg(a.q1, a.q2, a.q3, a.q4),
    avg(a.q5, a.q6, a.q7, q8r),
    avg(a.q9, a.q10, a.q11, a.q12),
    avg(a.q13, a.q14, a.q15, a.q16),
    avg(a.q17, a.q18, a.q19, a.q20),
    avg(a.q21, a.q22, a.q23, a.q24),
  ]
  return {
    honesty_humility: factors[0],
    emotionality: factors[1],
    extraversion: factors[2],
    agreeableness: factors[3],
    conscientiousness: factors[4],
    openness_to_experience: factors[5],
    overall: avg(...factors.filter(v => v > 0)),
  }
}

// ── Block 4: Values (Schwartz PVQ-RR) ────────────────────────

export interface ValuesAnswers {
  // Достижения и власть
  q1: number; q2: number; q3: number
  // Открытость к изменениям, самостоятельность
  q4: number; q5: number; q6: number
  // Забота о других, универсализм
  q7: number; q8: number; q9: number
  // Отношение к конкуренции и серым зонам (q12 reversed)
  q10: number; q11: number; q12: number
  // Безопасность (q15 reversed)
  q13: number; q14: number; q15: number
  // Удовольствие и гедонизм
  q16: number; q17: number; q18: number
}

export interface ValuesScores {
  achievement_power: number
  openness_self_direction: number
  universalism_benevolence: number
  ethics_rule_orientation: number
  security: number
  hedonism: number
  overall: number
}

export const VALUES_STORAGE_KEY = 'values_v1'

export function calcValuesScores(a: ValuesAnswers): ValuesScores {
  const avg = (...vals: number[]) => {
    const filled = vals.filter(v => v > 0)
    return filled.length ? filled.reduce((s, v) => s + v, 0) / filled.length : 0
  }
  // q12 and q15 are reverse-scored for 1–6 scale: reversed = 7 - answer
  const q12r = a.q12 > 0 ? 7 - a.q12 : 0
  const q15r = a.q15 > 0 ? 7 - a.q15 : 0
  const clusters = [
    avg(a.q1, a.q2, a.q3),
    avg(a.q4, a.q5, a.q6),
    avg(a.q7, a.q8, a.q9),
    avg(a.q10, a.q11, q12r),
    avg(a.q13, a.q14, q15r),
    avg(a.q16, a.q17, a.q18),
  ]
  return {
    achievement_power: clusters[0],
    openness_self_direction: clusters[1],
    universalism_benevolence: clusters[2],
    ethics_rule_orientation: clusters[3],
    security: clusters[4],
    hedonism: clusters[5],
    overall: avg(...clusters.filter(v => v > 0)),
  }
}

// ── Block 5: Identity (Fauchart & Gruber) ─────────────────────

export interface IdentityAnswers {
  // Darwinian
  q1: number; q2: number; q3: number; q4: number; q5: number
  // Communitarian
  q6: number; q7: number; q8: number; q9: number; q10: number
  // Missionary
  q11: number; q12: number; q13: number; q14: number; q15: number
}

export type IdentityType = 'darwinian' | 'communitarian' | 'missionary'

export interface IdentityScores {
  darwinian: number
  communitarian: number
  missionary: number
  dominant: IdentityType
  secondary: IdentityType | null
  isMixed: boolean
}

export const IDENTITY_STORAGE_KEY = 'identity_v1'

export function calcIdentityScores(a: IdentityAnswers): IdentityScores {
  const avg = (...vals: number[]) => {
    const filled = vals.filter(v => v > 0)
    return filled.length ? filled.reduce((s, v) => s + v, 0) / filled.length : 0
  }
  const darwinian = avg(a.q1, a.q2, a.q3, a.q4, a.q5)
  const communitarian = avg(a.q6, a.q7, a.q8, a.q9, a.q10)
  const missionary = avg(a.q11, a.q12, a.q13, a.q14, a.q15)

  const sorted = [
    { key: 'darwinian' as IdentityType, val: darwinian },
    { key: 'communitarian' as IdentityType, val: communitarian },
    { key: 'missionary' as IdentityType, val: missionary },
  ].filter(s => s.val > 0).sort((a, b) => b.val - a.val)

  const isMixed = sorted.length >= 2 && Math.abs(sorted[0].val - sorted[1].val) <= 0.3

  return {
    darwinian,
    communitarian,
    missionary,
    dominant: sorted[0]?.key ?? 'darwinian',
    secondary: sorted.length >= 2 ? sorted[1].key : null,
    isMixed,
  }
}

// ── Block 6: EntreComp (MVP slice) ────────────────────────────

export interface EntreCompAnswers {
  // Ideation & Opportunity
  q1: number; q2: number; q3: number
  // Action under uncertainty
  q4: number; q5: number; q6: number
  // Ethical orientation
  q7: number; q8: number; q9: number
}

export interface EntreCompScores {
  ideation_opportunity: number
  action_under_uncertainty: number
  ethical_orientation: number
  overall: number
}

export const ENTRECOMP_STORAGE_KEY = 'entrecomp_v1'

export function calcEntreCompScores(a: EntreCompAnswers): EntreCompScores {
  const avg = (...vals: number[]) => {
    const filled = vals.filter(v => v > 0)
    return filled.length ? filled.reduce((s, v) => s + v, 0) / filled.length : 0
  }
  const ideation = avg(a.q1, a.q2, a.q3)
  const action = avg(a.q4, a.q5, a.q6)
  const ethics = avg(a.q7, a.q8, a.q9)
  return {
    ideation_opportunity: ideation,
    action_under_uncertainty: action,
    ethical_orientation: ethics,
    overall: avg(...[ideation, action, ethics].filter(v => v > 0)),
  }
}
