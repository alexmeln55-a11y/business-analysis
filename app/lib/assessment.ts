// Shared types and constants for assessment module.
// Imported by founder-intake, ese, hexaco, and overview pages.

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
