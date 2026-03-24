// Shared types and constants for assessment module.
// Imported by founder-intake, ese, hexaco, values, identity, entrecomp, and overview pages.

// ── Block 1: Founder Intake ───────────────────────────────────

export interface FounderIntakeAnswers {
  q1: string; q2: string; q3: string; q4: string
  q5: string; q6: string; q7: string; q8: string
  q9: string; q10: string; q11: string; q12: string
  q13: string; q14: string; q15: string; q16: string
}

export const INTAKE_STORAGE_KEY = 'founder_intake_v1'

// ── Block 1 Structured (v2) ───────────────────────────────────

export interface FounderIntakeStructured {
  // Section 1: Skills (structured)
  skill_tags: string[]          // standard tags: 'sales', 'product', etc.
  custom_skills: CustomSkill[]  // custom skills added via "Другое"
  skills_paid_for: string[]     // tags of skills people already paid for
  skills_best_zone: string      // one short text (not scored, display only)

  // Section 2: Networks & Markets
  industries: string[]
  has_clients: boolean | null
  has_suppliers: boolean | null
  has_partners: boolean | null
  has_audience: boolean | null
  first_30_buyers: string

  // Section 3: Why unhappy with current business
  unhappy_reasons: string[]
  tried_to_change: string[]
  main_comment: string

  // Section 4: Resources
  time_per_week: string
  budget: string
  has_helpers: boolean | null
  helper_types: string[]
  months_without_profit: string
}

export const INTAKE_V2_STORAGE_KEY = 'founder_intake_v2'

// ── Block 1 v3: Profile-based structured intake ───────────────

export type ProfileAxis =
  | 'commercial_strength' | 'execution_strength' | 'product_build_signal'
  | 'finance_signal' | 'analytical_signal' | 'team_lead_signal'
  | 'market_access' | 'distribution_access' | 'partner_access' | 'audience_access'
  | 'solo_start_fit' | 'service_fit' | 'product_fit' | 'partner_led_fit'
  | 'low_risk_entry_fit' | 'speed_need' | 'capital_capacity' | 'risk_tolerance'

export const AXIS_LABELS: Record<ProfileAxis, string> = {
  commercial_strength: 'Коммерческая сила',
  execution_strength: 'Операционное исполнение',
  product_build_signal: 'Создание продукта',
  finance_signal: 'Финансы',
  analytical_signal: 'Аналитика',
  team_lead_signal: 'Управление командой',
  market_access: 'Доступ к рынку',
  distribution_access: 'Канал дистрибуции',
  partner_access: 'Партнёрский доступ',
  audience_access: 'Аудитория / бренд',
  solo_start_fit: 'Сольный запуск',
  service_fit: 'Сервисная модель',
  product_fit: 'Продуктовая модель',
  partner_led_fit: 'Партнёрский запуск',
  low_risk_entry_fit: 'Осторожный вход',
  speed_need: 'Нужна скорость',
  capital_capacity: 'Финансовый ресурс',
  risk_tolerance: 'Готовность к риску',
}

export interface CustomOption {
  label: string
  axis: ProfileAxis
}

export interface Block1QuestionAnswer {
  selected: string[]
  custom: CustomOption[]
}

export interface Block1Answers {
  q1: Block1QuestionAnswer; q2: Block1QuestionAnswer
  q3: Block1QuestionAnswer; q4: Block1QuestionAnswer
  q5: Block1QuestionAnswer; q6: Block1QuestionAnswer
  q7: Block1QuestionAnswer; q8: Block1QuestionAnswer
  q9: Block1QuestionAnswer; q10: Block1QuestionAnswer
  q11: Block1QuestionAnswer; q12: Block1QuestionAnswer
  q13: Block1QuestionAnswer; q14: Block1QuestionAnswer
  q15: Block1QuestionAnswer; q16: Block1QuestionAnswer
  q17: Block1QuestionAnswer; q18: Block1QuestionAnswer
}

export type Block1Profile = Partial<Record<ProfileAxis, number>>

export const BLOCK1_V3_STORAGE_KEY = 'block1_v3'
export const BLOCK1_PROFILE_KEY = 'block1_profile_v3'

// ── Skill tags & signals ──────────────────────────────────────

/** Canonical tag for each standard skill label */
export const SKILL_TAG_MAP: Record<string, string> = {
  'Продажи': 'sales',
  'Переговоры': 'negotiation',
  'Маркетинг': 'marketing',
  'Продукт / разработка продукта': 'product',
  'Найм и управление людьми': 'people_management',
  'Операционка': 'operations',
  'Финансы': 'finance',
  'Аналитика данных': 'analytics',
  'Закупки / логистика': 'logistics_procurement',
  'Консалтинг / обучение': 'consulting_training',
  'Внедрение / интеграция': 'implementation_integration',
  'Клиентский сервис': 'client_service',
}

/** Reverse map: tag → display label */
export const SKILL_LABEL_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SKILL_TAG_MAP).map(([label, tag]) => [tag, label]),
)

/** Founder profile signal derived from each standard skill tag */
export const SKILL_SIGNAL_MAP: Record<string, string> = {
  sales: 'commercial_strength',
  negotiation: 'commercial_strength',
  marketing: 'go_to_market_signal',
  product: 'product_build_signal',
  people_management: 'team_lead_signal',
  operations: 'execution_signal',
  finance: 'finance_signal',
  analytics: 'analytical_signal',
  logistics_procurement: 'supply_chain_signal',
  consulting_training: 'expert_service_signal',
  implementation_integration: 'implementation_signal',
  client_service: 'account_retention_signal',
}

export interface CustomSkill {
  label: string  // what the user typed
  tag: string    // format: custom:<slug>
}

/** Slugify text for custom tag generation */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 40)
}

/** Derive unique profile signals from standard tags + custom skills */
export function deriveSkillSignals(skillTags: string[], customSkills: CustomSkill[]): string[] {
  const signals = new Set<string>()
  for (const tag of skillTags) {
    const signal = SKILL_SIGNAL_MAP[tag]
    if (signal) signals.add(signal)
  }
  if (customSkills.length > 0) signals.add('custom_capability_signal')
  return Array.from(signals)
}

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

// ── ESE: no experience flags ──────────────────────────────────

export interface ESENoExperience {
  q1: boolean; q2: boolean; q3: boolean
  q4: boolean; q5: boolean; q6: boolean
  q7: boolean; q8: boolean; q9: boolean
  q10: boolean; q11: boolean; q12: boolean
  q13: boolean; q14: boolean; q15: boolean
}

export const ESE_NO_EXPERIENCE_STORAGE_KEY = 'ese_no_experience_v1'

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
  const q12r = a.q12 > 0 ? 6 - a.q12 : 0
  const q15r = a.q15 > 0 ? 6 - a.q15 : 0
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

// ── Identity scenarios (Fauchart & Gruber forced-choice) ──────

export type ScenarioChoice = 'a' | 'b' | 'c' | 'd' | null

export interface IdentityScenarios {
  s1: ScenarioChoice  // competitor copies and dumps
  s2: ScenarioChoice  // grow fast vs stay in niche
  s3: ScenarioChoice  // profitable contract contradicts values
}

export const IDENTITY_SCENARIOS_STORAGE_KEY = 'identity_scenarios_v1'

// Each scenario option signals one identity type:
// s1: a→darwinian, b→communitarian, c→missionary, d→darwinian
// s2: a→darwinian, b→communitarian, c→missionary
// s3: a→darwinian, b→missionary, c→darwinian, d→missionary
const SCENARIO_SIGNALS: Record<'s1' | 's2' | 's3', Partial<Record<'a' | 'b' | 'c' | 'd', IdentityType>>> = {
  s1: { a: 'darwinian', b: 'communitarian', c: 'missionary', d: 'darwinian' },
  s2: { a: 'darwinian', b: 'communitarian', c: 'missionary' },
  s3: { a: 'darwinian', b: 'missionary', c: 'darwinian', d: 'missionary' },
}

export function calcIdentityScoresWithScenarios(
  scale: IdentityAnswers,
  scenarios: Partial<IdentityScenarios>,
): IdentityScores {
  const base = calcIdentityScores(scale)
  const bonus: Record<IdentityType, number> = { darwinian: 0, communitarian: 0, missionary: 0 }

  for (const [sKey, choice] of Object.entries(scenarios) as ['s1' | 's2' | 's3', ScenarioChoice][]) {
    if (!choice || !(sKey in SCENARIO_SIGNALS)) continue
    const mapped = SCENARIO_SIGNALS[sKey][choice]
    if (mapped) bonus[mapped] += 0.3
  }

  const d = Math.min(5, base.darwinian + bonus.darwinian)
  const c = Math.min(5, base.communitarian + bonus.communitarian)
  const m = Math.min(5, base.missionary + bonus.missionary)

  const sorted = [
    { key: 'darwinian' as IdentityType, val: d },
    { key: 'communitarian' as IdentityType, val: c },
    { key: 'missionary' as IdentityType, val: m },
  ].filter(s => s.val > 0).sort((a, b) => b.val - a.val)

  const isMixed = sorted.length >= 2 && Math.abs(sorted[0].val - sorted[1].val) <= 0.3

  return {
    darwinian: d,
    communitarian: c,
    missionary: m,
    dominant: sorted[0]?.key ?? 'darwinian',
    secondary: sorted.length >= 2 ? sorted[1].key : null,
    isMixed,
  }
}

// ── Block 1 v4: AI-assisted free-text intake ──────────────────

export type IntakeQuestionStatus = 'draft' | 'clarifying' | 'resolved' | 'low_confidence' | 'skipped'

export interface ClarificationMessage {
  role: 'ai' | 'user'
  content: string
}

export interface IntakeQuestionAnswer {
  questionId: string
  rawAnswer: string
  clarificationHistory: ClarificationMessage[]
  finalClarifiedAnswer: string
  finalTag: string  // always from per-question whitelist
  confidence: 'high' | 'medium' | 'low'
  status: IntakeQuestionStatus
  reason_code?: string
}

export type Block1AIAnswers = Record<string, IntakeQuestionAnswer>

export const BLOCK1_AI_STORAGE_KEY = 'block1_ai_v1'

// Canonical tag labels (ProfileAxis superset used by AI intake)
export const AI_TAG_LABELS: Record<string, string> = {
  commercial_strength: 'Коммерческая сила',
  execution_strength: 'Операционное исполнение',
  product_build_signal: 'Создание продукта/сервиса',
  finance_signal: 'Финансы и учёт',
  analytical_signal: 'Аналитика и данные',
  team_lead_signal: 'Управление командой',
  service_fit: 'Сервисная модель',
  market_access: 'Доступ к рынку',
  distribution_access: 'Канал дистрибуции',
  partner_access: 'Партнёрский доступ',
  audience_access: 'Аудитория / личный бренд',
  solo_start_fit: 'Сольный запуск',
  product_fit: 'Продуктовая модель',
  partner_led_fit: 'Запуск через партнёра',
  speed_need: 'Нужен быстрый доход',
  low_risk_entry_fit: 'Осторожный вход',
  capital_capacity: 'Финансовый ресурс',
  risk_tolerance: 'Готовность к риску',
  no_signal: 'Нет подтверждённого сигнала',
}

// ── EntreComp v2: scenario + evidence ────────────────────────

export interface EntreCompV2Answers {
  // Scenarios (single choice a/b/c/d)
  s1: ScenarioChoice  // opportunity detection scenario
  s2: ScenarioChoice  // action under uncertainty scenario
  s3: ScenarioChoice  // ethics scenario

  // Evidence (past behavior)
  e1: 'yes' | 'no' | 'partial' | null  // launched with incomplete info
  e2: 'yes' | 'no' | 'partial' | null  // changed offer after market rejections
  e3: 'yes' | 'no' | null              // refused profitable deal due to principles
  e4: '0' | '1-2' | '3-5' | '5+' | null  // new ideas tested in last 2 years
}

export const ENTRECOMP_V2_STORAGE_KEY = 'entrecomp_v2'

export function calcEntreCompV2Scores(a: EntreCompV2Answers): EntreCompScores {
  const avg = (...vals: number[]) => {
    const filled = vals.filter(v => v > 0)
    return filled.length ? filled.reduce((s, v) => s + v, 0) / filled.length : 0
  }

  // Scenario scores (1–5 scale)
  // s1: saw non-standard client problem — what first?
  //   a: start investigating immediately → 5 (ideation)
  //   b: note and move on → 2.5
  //   c: ignore, not my area → 1
  //   d: ask client what they want → 3.5
  const s1s = a.s1 === 'a' ? 5 : a.s1 === 'd' ? 3.5 : a.s1 === 'b' ? 2.5 : a.s1 === 'c' ? 1 : 0

  // s2: market changes sharply — how do you act?
  //   a: act with info at hand → 5 (action)
  //   b: wait for more info → 1.5
  //   c: find partner to share risk → 3
  //   d: assess risks then decide → 3.5
  const s2s = a.s2 === 'a' ? 5 : a.s2 === 'd' ? 3.5 : a.s2 === 'c' ? 3 : a.s2 === 'b' ? 1.5 : 0

  // s3: profitable deal contradicts values — decision?
  //   a: refuse the deal → 5 (ethics)
  //   b: accept with modified conditions → 3
  //   c: accept as-is → 1
  //   d: consult partners before deciding → 3.5
  const s3s = a.s3 === 'a' ? 5 : a.s3 === 'd' ? 3.5 : a.s3 === 'b' ? 3 : a.s3 === 'c' ? 1 : 0

  // Evidence scores (1–5 scale)
  const toScore = (v: 'yes' | 'no' | 'partial' | null) =>
    v === 'yes' ? 5 : v === 'partial' ? 3.5 : v === 'no' ? 1.5 : 0

  const e1s = toScore(a.e1)
  const e2s = toScore(a.e2)
  const e3s = a.e3 === 'yes' ? 5 : a.e3 === 'no' ? 1.5 : 0
  const e4s = a.e4 === '5+' ? 5 : a.e4 === '3-5' ? 4 : a.e4 === '1-2' ? 2.5 : a.e4 === '0' ? 1 : 0

  // Competency scores: scenario + evidence combined
  const ideation = avg(s1s, e2s, e4s)
  const action = avg(s2s, e1s)
  const ethics = avg(s3s, e3s)

  return {
    ideation_opportunity: ideation,
    action_under_uncertainty: action,
    ethical_orientation: ethics,
    overall: avg(...[ideation, action, ethics].filter(v => v > 0)),
  }
}
