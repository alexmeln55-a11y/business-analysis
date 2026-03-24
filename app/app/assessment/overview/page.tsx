'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  INTAKE_STORAGE_KEY, INTAKE_V2_STORAGE_KEY,
  BLOCK1_AI_STORAGE_KEY,
  ESE_STORAGE_KEY, ESE_NO_EXPERIENCE_STORAGE_KEY,
  HEXACO_STORAGE_KEY, VALUES_STORAGE_KEY,
  IDENTITY_STORAGE_KEY, IDENTITY_SCENARIOS_STORAGE_KEY,
  ENTRECOMP_V2_STORAGE_KEY,
  calcESEScores, calcHEXACOScores, calcValuesScores,
  calcIdentityScores, calcIdentityScoresWithScenarios,
  calcEntreCompV2Scores,
  type FounderIntakeAnswers, type FounderIntakeStructured,
  type Block1AIAnswers,
  type ESEAnswers, type ESEScores, type ESENoExperience,
  type HEXACOAnswers, type HEXACOScores, type ValuesAnswers, type ValuesScores,
  type IdentityAnswers, type IdentityScores, type IdentityScenarios,
  type EntreCompV2Answers, type EntreCompScores,
} from '@/lib/assessment'

// ── Per-block interpretation helpers ─────────────────────────

const PHASE_LABELS: Record<keyof Omit<ESEScores, 'overall'>, string> = {
  opportunity_search: 'Поиск возможностей',
  planning: 'Планирование',
  resource_mobilization: 'Мобилизация ресурсов',
  people_execution: 'Реализация — люди',
  finance_market_execution: 'Реализация — финансы и рынок',
}
const PHASE_KEYS = Object.keys(PHASE_LABELS) as Array<keyof Omit<ESEScores, 'overall'>>

function interpretESE(s: ESEScores): string {
  const sorted = PHASE_KEYS.filter(k => s[k] > 0).sort((a, b) => s[b] - s[a])
  if (sorted.length === 0) return 'Ответы не заполнены.'
  const strongest = sorted[0]; const weakest = sorted[sorted.length - 1]
  let base = s.overall >= 5.5
    ? 'Высокая самоэффективность — уверенность охватывает большинство фаз запуска.'
    : s.overall >= 4
      ? 'Средняя самоэффективность — есть сильные зоны и зоны роста.'
      : 'Повышенная осторожность — рекомендуется начать с минимального теста.'
  const hints: string[] = []
  if (s.opportunity_search >= 5.5) hints.push('Сильный поиск возможностей.')
  if (s.resource_mobilization > 0 && s.resource_mobilization < 4) hints.push('Низкая уверенность в мобилизации ресурсов.')
  if (s.finance_market_execution > 0 && s.finance_market_execution < 4) hints.push('Низкая уверенность в финансах и рынке.')
  if (s.planning >= 5) hints.push('Сильное планирование.')
  const summary = [base, ...hints.slice(0, 2)].join(' ')
  return sorted.length >= 2
    ? `${summary} Сильнее: ${PHASE_LABELS[strongest]}. Внимание: ${PHASE_LABELS[weakest]}.`
    : summary
}

const HEXACO_LABELS: Record<keyof Omit<HEXACOScores, 'overall'>, string> = {
  honesty_humility: 'Честность–Смиренность',
  emotionality: 'Эмоциональность',
  extraversion: 'Экстраверсия',
  agreeableness: 'Доброжелательность',
  conscientiousness: 'Добросовестность',
  openness_to_experience: 'Открытость к опыту',
}
const HEXACO_KEYS = Object.keys(HEXACO_LABELS) as Array<keyof Omit<HEXACOScores, 'overall'>>

function interpretHEXACO(s: HEXACOScores): string {
  const filled = HEXACO_KEYS.filter(k => s[k] > 0)
  if (filled.length === 0) return 'Ответы не заполнены.'
  const sorted = [...filled].sort((a, b) => s[b] - s[a])
  const top = sorted.slice(0, 2); const bottom = sorted[sorted.length - 1]
  const hints: string[] = []
  if (s.honesty_humility >= 4) hints.push('Высокая честность — низкий риск манипулятивных продаж.')
  if (s.emotionality >= 4) hints.push('Высокая эмоциональность — нужны ритуалы восстановления.')
  if (s.extraversion >= 4) hints.push('Высокая экстраверсия — продажи и партнёрства даются легко.')
  if (s.conscientiousness >= 4) hints.push('Высокая добросовестность — сильная операционная дисциплина.')
  if (s.openness_to_experience >= 4) hints.push('Высокая открытость — готовность к нестандартным моделям.')
  if (s.extraversion > 0 && s.extraversion < 3) hints.push('Низкая экстраверсия — заложить больше времени на первые продажи.')
  if (s.conscientiousness > 0 && s.conscientiousness < 3) hints.push('Невысокая добросовестность — рекомендуется партнёр-оператор.')
  return [
    ...hints.slice(0, 2),
    `Выражены сильнее: ${top.map(k => HEXACO_LABELS[k]).join(', ')}.`,
    top[top.length - 1] !== bottom ? `Ниже среднего: ${HEXACO_LABELS[bottom]}.` : '',
  ].filter(Boolean).join(' ')
}

const VALUES_LABELS: Record<keyof Omit<ValuesScores, 'overall'>, string> = {
  achievement_power: 'Достижения и власть',
  openness_self_direction: 'Открытость, самостоятельность',
  universalism_benevolence: 'Забота о других',
  ethics_rule_orientation: 'Этика и правила',
  security: 'Безопасность',
  hedonism: 'Удовольствие',
}
const VALUES_KEYS = Object.keys(VALUES_LABELS) as Array<keyof Omit<ValuesScores, 'overall'>>

function interpretValues(s: ValuesScores): string {
  const filled = VALUES_KEYS.filter(k => s[k] > 0)
  if (filled.length === 0) return 'Ответы не заполнены.'
  const sorted = [...filled].sort((a, b) => s[b] - s[a])
  const top = sorted[0]; const bottom = sorted[sorted.length - 1]
  const hints: string[] = []
  if (s.achievement_power >= 4.5) hints.push('Сильная ориентация на результат и влияние.')
  if (s.openness_self_direction >= 4.5) hints.push('Высокая самостоятельность в выборе модели.')
  if (s.universalism_benevolence >= 4.5) hints.push('Важна польза и справедливость.')
  if (s.ethics_rule_orientation >= 4.5) hints.push('Высокая склонность к белым схемам.')
  if (s.security >= 4.5) hints.push('Осторожный вход важен — нужна финансовая подушка.')
  if (s.hedonism >= 4.5) hints.push('Важно качество повседневной жизни.')
  if (s.security > 0 && s.security < 3) hints.push('Низкий приоритет безопасности — готов к высокому риску.')
  return [
    ...hints.slice(0, 2),
    `Выражено сильнее: ${VALUES_LABELS[top]}.`,
    top !== bottom ? `Ниже среднего: ${VALUES_LABELS[bottom]}.` : '',
  ].filter(Boolean).join(' ')
}

const IDENTITY_LABELS: Record<'darwinian' | 'communitarian' | 'missionary', string> = {
  darwinian: 'Рыночная (Darwinian)',
  communitarian: 'Сообщество (Communitarian)',
  missionary: 'Миссионерская (Missionary)',
}
const IDENTITY_HINTS: Record<'darwinian' | 'communitarian' | 'missionary', string> = {
  darwinian: 'Сильная ориентация на рост, прибыль, конкуренцию и эффективность.',
  communitarian: 'Сильная связка с конкретной аудиторией, нишей, отношениями и доверием.',
  missionary: 'Сильная опора на идею, ценности и смысл изменений.',
}
const MIXED_HINTS: Partial<Record<string, string>> = {
  'darwinian+missionary': 'Сочетание рыночной прагматики и стремления к влиянию через идею.',
  'missionary+darwinian': 'Сочетание рыночной прагматики и стремления к влиянию через идею.',
  'communitarian+missionary': 'Дело строится вокруг людей и ценностей одновременно.',
  'missionary+communitarian': 'Дело строится вокруг людей и ценностей одновременно.',
  'darwinian+communitarian': 'Ориентация на нишу с сильной рыночной прагматикой.',
  'communitarian+darwinian': 'Ориентация на нишу с сильной рыночной прагматикой.',
}

function interpretIdentity(s: IdentityScores): string {
  if (s.darwinian === 0 && s.communitarian === 0 && s.missionary === 0) return 'Ответы не заполнены.'
  if (s.isMixed && s.secondary) {
    const hint = MIXED_HINTS[`${s.dominant}+${s.secondary}`] ?? ''
    return [`Смешанный профиль: ${IDENTITY_LABELS[s.dominant]} и ${IDENTITY_LABELS[s.secondary]}.`, hint].filter(Boolean).join(' ')
  }
  return `Преобладает: ${IDENTITY_LABELS[s.dominant]}. ${IDENTITY_HINTS[s.dominant]}${s.secondary ? ` На втором месте: ${IDENTITY_LABELS[s.secondary]}.` : ''}`
}

const ENTRECOMP_LABELS: Record<keyof Omit<EntreCompScores, 'overall'>, string> = {
  ideation_opportunity: 'Идеация и возможности',
  action_under_uncertainty: 'Действие в неопределённости',
  ethical_orientation: 'Этическое измерение',
}
const ENTRECOMP_KEYS = Object.keys(ENTRECOMP_LABELS) as Array<keyof Omit<EntreCompScores, 'overall'>>

function interpretEntreComp(s: EntreCompScores): string {
  const filled = ENTRECOMP_KEYS.filter(k => s[k] > 0)
  if (filled.length === 0) return 'Ответы не заполнены.'
  const sorted = [...filled].sort((a, b) => s[b] - s[a])
  const hints: string[] = []
  if (s.ideation_opportunity >= 4) hints.push('Хорошо замечает возможности и формулирует идеи под рынок.')
  if (s.action_under_uncertainty >= 4) hints.push('Способен запускаться без идеальных условий и быстро адаптироваться.')
  if (s.ethical_orientation >= 4) hints.push('Учитывает последствия решений и держит ценностные границы.')
  if (s.ideation_opportunity > 0 && s.ideation_opportunity < 3) hints.push('Поиск возможностей — зона роста.')
  if (s.action_under_uncertainty > 0 && s.action_under_uncertainty < 3) hints.push('Действие в неопределённости — зона роста: помогает MVP-подход.')
  return [
    ...hints.slice(0, 2),
    sorted.length >= 2
      ? `Выражено сильнее: ${ENTRECOMP_LABELS[sorted[0]]}. Ниже: ${ENTRECOMP_LABELS[sorted[sorted.length - 1]]}.`
      : `Выражено: ${ENTRECOMP_LABELS[sorted[0]]}.`,
  ].filter(Boolean).join(' ')
}

// ── Founder summary builder ────────────────────────────────────

interface FounderSummaryOutput {
  completedCount: number
  strengths: string[]
  riskZones: string[]
  launchStyle: string
  opportunityFit: string[]
}

function buildFounderSummary(
  b1: FounderIntakeAnswers | null,
  b1v2: FounderIntakeStructured | null,
  ese: ESEScores | null,
  hexaco: HEXACOScores | null,
  values: ValuesScores | null,
  identity: IdentityScores | null,
  entrecomp: EntreCompScores | null,
  b1ai: Block1AIAnswers | null,
): FounderSummaryOutput {
  // b1 completed if v2 has any selections, else fall back to v1, else AI
  const b1v2Done = b1v2
    ? ((b1v2.skill_tags?.length ?? 0) > 0 || (b1v2.industries?.length ?? 0) > 0 ||
       (b1v2.unhappy_reasons?.length ?? 0) > 0 || (b1v2.time_per_week ?? '') !== '')
    : false
  const b1v1Done = b1 ? Object.values(b1).some(v => typeof v === 'string' && (v as string).trim().length > 0) : false
  const b1aiResolved = b1ai
    ? Object.values(b1ai).filter(a => a.status === 'resolved' || a.status === 'low_confidence').length
    : 0
  const b1aiDone = b1aiResolved >= 4
  const b1Done = b1v2Done || b1v1Done || b1aiDone
  const identityDone = identity ? (identity.darwinian > 0 || identity.communitarian > 0 || identity.missionary > 0) : false

  const completedCount = [
    b1Done,
    ese && ese.overall > 0,
    hexaco && hexaco.overall > 0,
    values && values.overall > 0,
    identityDone,
    entrecomp && entrecomp.overall > 0,
  ].filter(Boolean).length

  // ── Strengths ──────────────────────────────────────────────
  const strengths: string[] = []
  if (b1v2) {
    if ((b1v2.skill_tags?.length ?? 0) >= 3)
      strengths.push('Широкий набор практических навыков для ручного старта')
    if (b1v2.has_clients || b1v2.has_audience || (b1v2.first_30_buyers ?? '').trim().length > 5)
      strengths.push('Есть прямой доступ к рынку и первым клиентам')
    if ((b1v2.industries?.length ?? 0) >= 2)
      strengths.push(`Контакты в ${b1v2.industries.length} отраслях — широкие возможности входа`)
    if (b1v2.has_partners && b1v2.has_suppliers)
      strengths.push('Есть поставщики и партнёры — инфраструктура для быстрого запуска')
  } else if (b1ai && b1aiDone) {
    const tags = Object.values(b1ai).map(a => a.finalTag).filter(Boolean)
    if (tags.includes('commercial_strength'))
      strengths.push('Сильная коммерческая база — продажи, переговоры, привлечение клиентов')
    if (tags.includes('product_build_signal'))
      strengths.push('Навык создания продукта или сервиса с нуля')
    if (tags.includes('execution_strength'))
      strengths.push('Сильное операционное исполнение — процессы и управление')
    if (tags.includes('market_access') || tags.includes('distribution_access'))
      strengths.push('Есть прямой доступ к рынку и первым клиентам')
    if (tags.includes('partner_access') || tags.includes('audience_access'))
      strengths.push('Есть партнёрский или аудиторный ресурс для быстрого старта')
  } else if (b1) {
    if (b1.q1.trim().length > 10 || b1.q2.trim().length > 10)
      strengths.push('Сильная практическая база для ручного старта')
    if (b1.q5.trim().length > 5 || b1.q6.trim().length > 5)
      strengths.push('Есть прямой доступ к рынку и первым клиентам')
  }
  if (ese && ese.overall > 0) {
    if (ese.opportunity_search >= 5) strengths.push('Высокая уверенность в поиске и оценке возможностей')
    if (ese.planning >= 5) strengths.push('Структурное планирование как рабочий инструмент запуска')
    if (ese.overall >= 5.5) strengths.push('Высокая общая самоэффективность — уверен в большинстве фаз')
  }
  if (hexaco && hexaco.overall > 0) {
    if (hexaco.conscientiousness >= 4) strengths.push('Выраженная дисциплина и управляемость исполнения')
    if (hexaco.openness_to_experience >= 4) strengths.push('Высокая готовность к нестандартным моделям и экспериментам')
    if (hexaco.extraversion >= 4) strengths.push('Сильные навыки продаж, переговоров и партнёрств')
  }
  if (values && values.overall > 0) {
    if (values.achievement_power >= 4.5) strengths.push('Сильная ориентация на результат и рост')
    if (values.ethics_rule_orientation >= 4.5) strengths.push('Высокая ценностная чистота — снижает правовые риски')
  }
  if (entrecomp && entrecomp.overall > 0) {
    if (entrecomp.ideation_opportunity >= 4) strengths.push('Хорошо видит рыночные пробелы и формулирует идеи')
    if (entrecomp.action_under_uncertainty >= 4) strengths.push('Запускается без идеальных условий, быстро адаптируется')
  }

  // ── Risk zones ─────────────────────────────────────────────
  const riskZones: string[] = []
  if (ese && ese.overall > 0) {
    if (ese.resource_mobilization > 0 && ese.resource_mobilization < 3.5)
      riskZones.push('Может быть слабее фаза мобилизации людей и ресурсов')
    if (ese.finance_market_execution > 0 && ese.finance_market_execution < 3.5)
      riskZones.push('Осторожность в финансовых решениях — может удлинять вход')
    if (ese.people_execution > 0 && ese.people_execution < 3.5)
      riskZones.push('Управление командой — стоит рассмотреть партнёра-оператора')
  }
  if (hexaco && hexaco.overall > 0) {
    if (hexaco.extraversion > 0 && hexaco.extraversion < 3)
      riskZones.push('Первые продажи могут даваться сложнее — стоит заложить время')
    if (hexaco.emotionality >= 4)
      riskZones.push('Высокая чувствительность к неопределённости — важны паузы и восстановление')
  }
  if (values && values.security >= 4.5)
    riskZones.push('Осторожное отношение к риску может удлинять решение о запуске')
  if (identity && identityDone && identity.dominant === 'communitarian' && !identity.isMixed)
    riskZones.push('Ниша-ориентация может ограничивать масштабирование за пределы сообщества')
  if (entrecomp && entrecomp.action_under_uncertainty > 0 && entrecomp.action_under_uncertainty < 3)
    riskZones.push('Сложнее запускаться без полного плана — MVP-подход и короткие итерации помогут')

  // ── Launch style ───────────────────────────────────────────
  let launchStyle = 'Лучше начать с короткого ручного теста: интервью, первые продажи, быстрая обратная связь — до серьёзных вложений.'

  if (identity && identityDone) {
    if (identity.dominant === 'communitarian') {
      launchStyle = 'Заходить через нишевую экспертизу и доверие аудитории. Первые клиенты — уже из вашей сети. Сначала глубина и конкретное сообщество, потом масштаб.'
    } else if (identity.dominant === 'missionary') {
      launchStyle = 'Заходить через идею и сообщество вокруг неё. Первые клиенты приходят через доверие к позиции. Монетизация строится поверх доверия, а не наоборот.'
    } else if (identity.dominant === 'darwinian') {
      launchStyle = entrecomp && entrecomp.action_under_uncertainty >= 4
        ? 'Можно пробовать агрессивный запуск: быстрый тест, быстрая коррекция, рост через конкуренцию. Скорость и жёсткая среда — сильная сторона.'
        : 'Заходить через чёткую рыночную гипотезу с конкретной метрикой успеха. Проверять юнит-экономику до масштабирования.'
    } else if (identity.isMixed && identity.secondary) {
      if ((identity.dominant === 'communitarian' && identity.secondary === 'missionary') ||
          (identity.dominant === 'missionary' && identity.secondary === 'communitarian')) {
        launchStyle = 'Заходить через сообщество и идею одновременно. Это медленнее, но создаёт высокий барьер для конкурентов: доверие + смысл.'
      }
    }
  } else if (values && values.security >= 4.5) {
    launchStyle = 'Аккуратная валидация с ограниченным риском. Сначала подтвердить спрос малым тестом, потом вкладываться. Финансовая подушка перед запуском снизит стресс.'
  }

  // ── Opportunity fit ────────────────────────────────────────
  const opportunityFit: string[] = []
  if (identity && identityDone) {
    if (identity.dominant === 'communitarian')
      opportunityFit.push('Лучше подходят рынки, где важны доверие, экспертиза и долгосрочные отношения')
    else if (identity.dominant === 'missionary')
      opportunityFit.push('Лучше подходят возможности с чёткой миссией и монетизацией через изменение')
    else if (identity.dominant === 'darwinian')
      opportunityFit.push('Лучше подходят конкурентные рынки с понятными метриками роста')
  }
  if (entrecomp && entrecomp.action_under_uncertainty >= 4)
    opportunityFit.push('Больше подходят ниши с быстрым тестом и ранней выручкой')
  if (hexaco && hexaco.extraversion >= 4)
    opportunityFit.push('Подходят модели с партнёрским или network-led входом')
  if (values && values.security >= 4.5)
    opportunityFit.push('Менее подходят капиталоёмкие и высоконеопределённые входы без быстрой проверки спроса')
  if (hexaco && hexaco.conscientiousness >= 4)
    opportunityFit.push('Подходят модели, где дисциплина и управляемость — конкурентное преимущество')
  if (b1v2 && !b1v2.has_helpers)
    opportunityFit.push('Лучше подходят модели, где можно начать без большой команды')
  else if (!b1v2 && b1 && !b1.q15.trim())
    opportunityFit.push('Лучше подходят модели, где можно начать без большой команды')
  else if (!b1v2 && !b1 && b1ai && b1aiDone) {
    const tags = Object.values(b1ai).map(a => a.finalTag).filter(Boolean)
    if (tags.includes('solo_start_fit'))
      opportunityFit.push('Лучше подходят модели, где можно начать без большой команды')
    if (tags.includes('capital_capacity'))
      opportunityFit.push('Подходят модели с умеренным капиталоёмким входом')
    if (tags.includes('risk_tolerance'))
      opportunityFit.push('Подходят модели с агрессивным тестом и быстрым ростом')
  }

  return {
    completedCount,
    strengths: strengths.slice(0, 5),
    riskZones: riskZones.slice(0, 4),
    launchStyle,
    opportunityFit: opportunityFit.slice(0, 4),
  }
}

// ── Component ─────────────────────────────────────────────────

export default function AssessmentOverviewPage() {
  const [b1Answers, setB1Answers] = useState<FounderIntakeAnswers | null>(null)
  const [b1v2Answers, setB1v2Answers] = useState<FounderIntakeStructured | null>(null)
  const [b1aiAnswers, setB1aiAnswers] = useState<Block1AIAnswers | null>(null)
  const [eseAnswers, setEseAnswers] = useState<ESEAnswers | null>(null)
  const [eseNoExp, setEseNoExp] = useState<ESENoExperience | null>(null)
  const [hexacoAnswers, setHexacoAnswers] = useState<HEXACOAnswers | null>(null)
  const [valuesAnswers, setValuesAnswers] = useState<ValuesAnswers | null>(null)
  const [identityAnswers, setIdentityAnswers] = useState<IdentityAnswers | null>(null)
  const [identityScenarios, setIdentityScenarios] = useState<IdentityScenarios | null>(null)
  const [entrecompV2Answers, setEntrecompV2Answers] = useState<EntreCompV2Answers | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const r1 = localStorage.getItem(INTAKE_STORAGE_KEY); if (r1) setB1Answers(JSON.parse(r1))
      const r1v2 = localStorage.getItem(INTAKE_V2_STORAGE_KEY); if (r1v2) setB1v2Answers(JSON.parse(r1v2))
      const r1ai = localStorage.getItem(BLOCK1_AI_STORAGE_KEY); if (r1ai) setB1aiAnswers(JSON.parse(r1ai))
      const r2 = localStorage.getItem(ESE_STORAGE_KEY); if (r2) setEseAnswers(JSON.parse(r2))
      const r2ne = localStorage.getItem(ESE_NO_EXPERIENCE_STORAGE_KEY); if (r2ne) setEseNoExp(JSON.parse(r2ne))
      const r3 = localStorage.getItem(HEXACO_STORAGE_KEY); if (r3) setHexacoAnswers(JSON.parse(r3))
      const r4 = localStorage.getItem(VALUES_STORAGE_KEY); if (r4) setValuesAnswers(JSON.parse(r4))
      const r5 = localStorage.getItem(IDENTITY_STORAGE_KEY); if (r5) setIdentityAnswers(JSON.parse(r5))
      const r5s = localStorage.getItem(IDENTITY_SCENARIOS_STORAGE_KEY); if (r5s) setIdentityScenarios(JSON.parse(r5s))
      const r6v2 = localStorage.getItem(ENTRECOMP_V2_STORAGE_KEY); if (r6v2) setEntrecompV2Answers(JSON.parse(r6v2))
    } catch {}
    setLoaded(true)
  }, [])

  const eseScores = eseAnswers ? calcESEScores(eseAnswers) : null
  const hexacoScores = hexacoAnswers ? calcHEXACOScores(hexacoAnswers) : null
  const valuesScores = valuesAnswers ? calcValuesScores(valuesAnswers) : null
  const identityScores = identityAnswers
    ? (identityScenarios
        ? calcIdentityScoresWithScenarios(identityAnswers, identityScenarios)
        : calcIdentityScores(identityAnswers))
    : null
  const entrecompScores = entrecompV2Answers ? calcEntreCompV2Scores(entrecompV2Answers) : null

  const eseHasData = eseScores && eseScores.overall > 0
  const hexacoHasData = hexacoScores && hexacoScores.overall > 0
  const valuesHasData = valuesScores && valuesScores.overall > 0
  const identityHasData = identityScores && (identityScores.darwinian > 0 || identityScores.communitarian > 0 || identityScores.missionary > 0)
  const entrecompHasData = entrecompScores && entrecompScores.overall > 0

  const summary = buildFounderSummary(b1Answers, b1v2Answers, eseScores, hexacoScores, valuesScores, identityScores, entrecompScores, b1aiAnswers)
  const allDone = summary.completedCount === 6
  const hasSomeData = summary.completedCount > 0

  if (!loaded) return null

  return (
    <div style={{ maxWidth: '700px' }}>

      {/* Back */}
      <Link href="/assessment" style={{
        fontSize: '14px', color: '#9B8A7A', textDecoration: 'none',
        display: 'inline-block', marginBottom: '32px',
      }}>
        ← Диагностика
      </Link>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '12px' }}>
          ИТОГ ДИАГНОСТИКИ
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#F4EDE3', lineHeight: 1.2, marginBottom: '20px' }}>
          Профиль основателя
        </h1>

        {/* Completion status */}
        <div style={{
          backgroundColor: allDone ? 'rgba(107,168,122,0.08)' : '#1F1A16',
          border: allDone ? '1px solid rgba(107,168,122,0.25)' : '1px solid rgba(181,122,86,0.20)',
          borderRadius: '18px', padding: '18px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: allDone ? '#6BA87A' : '#D09062', marginBottom: '4px' }}>
              {allDone ? 'Диагностика завершена' : `Заполнено ${summary.completedCount} из 6 блоков`}
            </div>
            {!allDone && (
              <div style={{ fontSize: '13px', color: '#9B8A7A' }}>
                Чем больше блоков заполнено, тем точнее итог
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {[1, 2, 3, 4, 5, 6].map(n => {
              const done = n <= summary.completedCount
              return (
                <div key={n} style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  backgroundColor: done ? '#6BA87A' : 'rgba(244,237,227,0.10)',
                }} />
              )
            })}
          </div>
        </div>

        {/* Incomplete CTA */}
        {!allDone && (
          <div style={{ marginTop: '12px' }}>
            <Link href="/assessment" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: 'transparent', color: '#B57A56',
                border: '1px solid rgba(181,122,86,0.30)', borderRadius: '14px',
                padding: '10px 20px', fontSize: '14px', cursor: 'pointer',
              }}>
                Продолжить диагностику →
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Synthetic sections (shown if any data) ─────────── */}
      {hasSomeData && (
        <>
          {/* Section A: Сильные стороны */}
          {summary.strengths.length > 0 && (
            <SummarySection
              tag="A"
              title="Сильные стороны"
              subtitle="Что работает в пользу основателя"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summary.strengths.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    backgroundColor: 'rgba(107,168,122,0.07)',
                    border: '1px solid rgba(107,168,122,0.15)',
                    borderRadius: '14px', padding: '12px 16px',
                  }}>
                    <span style={{ color: '#6BA87A', fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                    <span style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </SummarySection>
          )}

          {/* Section B: Зоны риска */}
          {summary.riskZones.length > 0 && (
            <SummarySection
              tag="B"
              title="Зоны риска"
              subtitle="На что обратить внимание при запуске"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summary.riskZones.map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    backgroundColor: 'rgba(181,122,86,0.07)',
                    border: '1px solid rgba(181,122,86,0.15)',
                    borderRadius: '14px', padding: '12px 16px',
                  }}>
                    <span style={{ color: '#B57A56', fontSize: '13px', flexShrink: 0, marginTop: '2px' }}>◆</span>
                    <span style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.5 }}>{r}</span>
                  </div>
                ))}
              </div>
            </SummarySection>
          )}

          {/* Section C: Предпочтительный стиль запуска */}
          <SummarySection
            tag="C"
            title="Предпочтительный стиль запуска"
            subtitle="Как заходить в новое направление"
          >
            <div style={{
              backgroundColor: '#1F1A16',
              border: '1px solid rgba(181,122,86,0.20)',
              borderRadius: '16px', padding: '18px 20px',
            }}>
              <p style={{ fontSize: '15px', color: '#F4EDE3', lineHeight: 1.65 }}>
                {summary.launchStyle}
              </p>
            </div>
          </SummarySection>

          {/* Section D: Что это значит для возможностей */}
          {summary.opportunityFit.length > 0 && (
            <SummarySection
              tag="D"
              title="Что это значит для возможностей"
              subtitle="Какие opportunity patterns подходят больше"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summary.opportunityFit.map((o, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    backgroundColor: '#1A1613',
                    border: '1px solid rgba(244,237,227,0.08)',
                    borderRadius: '14px', padding: '12px 16px',
                  }}>
                    <span style={{ color: '#9B8A7A', fontSize: '13px', flexShrink: 0, marginTop: '2px' }}>→</span>
                    <span style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.5 }}>{o}</span>
                  </div>
                ))}
              </div>
            </SummarySection>
          )}
        </>
      )}

      {/* ── Per-block details ───────────────────────────────── */}
      <div style={{ height: '1px', backgroundColor: 'rgba(244,237,227,0.06)', margin: '48px 0 32px' }} />

      <div style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '32px' }}>
        РАЗБОР ПО БЛОКАМ
      </div>

      {/* Block 1 */}
      {b1Answers && (
        <BlockDetail title="Блок 1 · Опыт, связи и ресурсы">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {b1Answers.q1.trim() && <MiniRow label="Навыки" value={b1Answers.q1.slice(0, 120)} />}
            {b1Answers.q5.trim() && <MiniRow label="Рыночные связи" value={b1Answers.q5.slice(0, 120)} />}
            {b1Answers.q13.trim() && <MiniRow label="Время" value={b1Answers.q13.slice(0, 80)} />}
            {b1Answers.q14.trim() && <MiniRow label="Бюджет" value={b1Answers.q14.slice(0, 80)} />}
          </div>
        </BlockDetail>
      )}

      {/* Block 2 ESE */}
      {eseHasData && (
        <BlockDetail title="Блок 2 · ESE — Предпринимательская самоэффективность">
          <ScoreWithBars overall={eseScores!.overall} overallMax={7} overallLabel="СРЕДНИЙ / 7">
            {PHASE_KEYS.map(k => <MiniBar key={k} label={PHASE_LABELS[k]} score={eseScores![k]} max={7} />)}
          </ScoreWithBars>
          <InterpText>{interpretESE(eseScores!)}</InterpText>
        </BlockDetail>
      )}
      {!eseHasData && <IncompleteBlock label="Блок 2 · ESE" href="/assessment/ese" />}

      {/* Block 3 HEXACO */}
      {hexacoHasData && (
        <BlockDetail title="Блок 3 · HEXACO — Личностный профиль">
          <ScoreWithBars overall={hexacoScores!.overall} overallMax={5} overallLabel="СРЕДНИЙ / 5">
            {HEXACO_KEYS.map(k => <MiniBar key={k} label={HEXACO_LABELS[k]} score={hexacoScores![k]} max={5} />)}
          </ScoreWithBars>
          <InterpText>{interpretHEXACO(hexacoScores!)}</InterpText>
        </BlockDetail>
      )}
      {!hexacoHasData && <IncompleteBlock label="Блок 3 · HEXACO" href="/assessment/hexaco" />}

      {/* Block 4 Values */}
      {valuesHasData && (
        <BlockDetail title="Блок 4 · Ценности — Schwartz PVQ-RR">
          <ScoreWithBars overall={valuesScores!.overall} overallMax={6} overallLabel="СРЕДНИЙ / 6">
            {VALUES_KEYS.map(k => <MiniBar key={k} label={VALUES_LABELS[k]} score={valuesScores![k]} max={6} />)}
          </ScoreWithBars>
          <InterpText>{interpretValues(valuesScores!)}</InterpText>
        </BlockDetail>
      )}
      {!valuesHasData && <IncompleteBlock label="Блок 4 · Ценности" href="/assessment/values" />}

      {/* Block 5 Identity */}
      {identityHasData && (
        <BlockDetail title="Блок 5 · Предпринимательская идентичность">
          <ScoreWithBars overall={null} overallMax={5} overallLabel="">
            <MiniBar label="Рыночная (Darwinian)" score={identityScores!.darwinian} max={5} />
            <MiniBar label="Сообщество (Communitarian)" score={identityScores!.communitarian} max={5} />
            <MiniBar label="Миссионерская (Missionary)" score={identityScores!.missionary} max={5} />
          </ScoreWithBars>
          <InterpText>{interpretIdentity(identityScores!)}</InterpText>
        </BlockDetail>
      )}
      {!identityHasData && <IncompleteBlock label="Блок 5 · Идентичность" href="/assessment/identity" />}

      {/* Block 6 EntreComp */}
      {entrecompHasData && (
        <BlockDetail title="Блок 6 · Компетенции — EntreComp">
          <ScoreWithBars overall={entrecompScores!.overall} overallMax={5} overallLabel="СРЕДНИЙ / 5">
            {ENTRECOMP_KEYS.map(k => <MiniBar key={k} label={ENTRECOMP_LABELS[k]} score={entrecompScores![k]} max={5} />)}
          </ScoreWithBars>
          <InterpText>{interpretEntreComp(entrecompScores!)}</InterpText>
        </BlockDetail>
      )}
      {!entrecompHasData && <IncompleteBlock label="Блок 6 · EntreComp" href="/assessment/entrecomp" />}

      {/* ── Note ───────────────────────────────────────────── */}
      <div style={{
        backgroundColor: '#1A1613', borderRadius: '16px', padding: '18px 22px',
        border: '1px solid rgba(244,237,227,0.07)', margin: '40px 0',
      }}>
        <p style={{ fontSize: '13px', color: '#9B8A7A', lineHeight: 1.6 }}>
          Это рабочий профиль на основе ваших ответов — не психологический диагноз.
          После подключения системы оценки параметры будут включены в scoring возможностей.
        </p>
      </div>

      {/* ── CTA ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '48px' }}>
        {allDone ? (
          <Link href="/discovery" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%', backgroundColor: '#B57A56', color: '#F4EDE3',
              border: 'none', borderRadius: '16px', padding: '16px 28px',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>Перейти к возможностям</span>
              <span>→</span>
            </button>
          </Link>
        ) : (
          <Link href="/assessment" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%', backgroundColor: '#B57A56', color: '#F4EDE3',
              border: 'none', borderRadius: '16px', padding: '16px 28px',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>Продолжить диагностику</span>
              <span>→</span>
            </button>
          </Link>
        )}
        <Link href="/assessment" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%', backgroundColor: 'transparent', color: '#9B8A7A',
            border: '1px solid rgba(244,237,227,0.10)', borderRadius: '16px',
            padding: '14px 28px', fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}>
            <span>Вернуться к диагностике</span>
            <span style={{ fontSize: '12px' }}>Все 6 блоков</span>
          </button>
        </Link>
      </div>

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function SummarySection({
  tag, title, subtitle, children,
}: {
  tag: string; title: string; subtitle: string; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <div style={{
          width: '22px', height: '22px', borderRadius: '6px',
          backgroundColor: 'rgba(181,122,86,0.18)',
          border: '1px solid rgba(181,122,86,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#D09062' }}>{tag}</span>
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#F4EDE3' }}>{title}</h2>
      </div>
      <div style={{ fontSize: '13px', color: '#6B5D52', marginBottom: '16px', paddingLeft: '32px' }}>
        {subtitle}
      </div>
      {children}
    </div>
  )
}

function BlockDetail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.05em', marginBottom: '14px' }}>
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  )
}

function IncompleteBlock({ label, href }: { label: string; href: string }) {
  return (
    <div style={{
      marginBottom: '32px', opacity: 0.55,
      backgroundColor: '#141210', borderRadius: '14px', padding: '16px 20px',
      border: '1px solid rgba(244,237,227,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
    }}>
      <span style={{ fontSize: '13px', color: '#6B5D52' }}>{label} — не пройден</span>
      <Link href={href} style={{ textDecoration: 'none' }}>
        <span style={{
          fontSize: '12px', fontWeight: 600, color: '#B57A56',
          backgroundColor: 'rgba(181,122,86,0.12)',
          padding: '5px 12px', borderRadius: '10px',
        }}>
          Пройти →
        </span>
      </Link>
    </div>
  )
}

function ScoreWithBars({
  overall, overallMax, overallLabel, children,
}: {
  overall: number | null; overallMax: number; overallLabel: string; children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '20px',
      backgroundColor: '#1F1A16', borderRadius: '16px', padding: '16px 20px',
      border: '1px solid rgba(181,122,86,0.18)', marginBottom: '12px',
    }}>
      {overall !== null && (
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#D09062', lineHeight: 1 }}>
            {overall.toFixed(1)}
          </div>
          <div style={{ fontSize: '10px', color: '#9B8A7A', letterSpacing: '0.06em', marginTop: '4px' }}>
            {overallLabel}
          </div>
        </div>
      )}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function MiniBar({ label, score, max }: { label: string; score: number; max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
      <div style={{ fontSize: '12px', color: '#9B8A7A', width: '160px', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: 'rgba(244,237,227,0.08)' }}>
        <div style={{
          height: '100%',
          width: score > 0 ? `${(score / max) * 100}%` : '0%',
          backgroundColor: '#B57A56', borderRadius: '2px',
        }} />
      </div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#D09062', width: '26px', textAlign: 'right' }}>
        {score > 0 ? score.toFixed(1) : '—'}
      </div>
    </div>
  )
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      backgroundColor: '#1A1613', borderRadius: '12px', padding: '12px 16px',
      border: '1px solid rgba(244,237,227,0.07)',
    }}>
      <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.05em', marginBottom: '4px' }}>
        {label.toUpperCase()}
      </div>
      <p style={{ fontSize: '13px', color: '#CDBEAE', lineHeight: 1.55 }}>{value}</p>
    </div>
  )
}

function InterpText({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: '#1A1613', borderRadius: '12px', padding: '14px 18px',
      border: '1px solid rgba(244,237,227,0.07)',
    }}>
      <div style={{ fontSize: '10px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '6px' }}>
        ИНТЕРПРЕТАЦИЯ
      </div>
      <p style={{ fontSize: '13px', color: '#CDBEAE', lineHeight: 1.6 }}>{children}</p>
    </div>
  )
}
