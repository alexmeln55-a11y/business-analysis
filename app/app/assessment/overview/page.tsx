'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BLOCK1_AI_STORAGE_KEY,
  ESE_STORAGE_KEY, ESE_NO_EXPERIENCE_STORAGE_KEY,
  HEXACO_STORAGE_KEY, VALUES_STORAGE_KEY,
  IDENTITY_STORAGE_KEY, IDENTITY_SCENARIOS_STORAGE_KEY,
  ENTRECOMP_V2_STORAGE_KEY,
  calcESEScores, calcHEXACOScores, calcValuesScores,
  calcIdentityScoresWithScenarios, calcIdentityScores,
  calcEntreCompV2Scores,
  buildFounderProfile,
  AI_TAG_LABELS,
  type Block1AIAnswers,
  type ESEAnswers, type ESEScores, type ESENoExperience,
  type HEXACOAnswers, type HEXACOScores,
  type ValuesAnswers, type ValuesScores,
  type IdentityAnswers, type IdentityScores, type IdentityScenarios,
  type EntreCompV2Answers, type EntreCompScores,
  type FounderProfile, type ProfileFact,
} from '@/lib/assessment'
import type { AISynthesis } from '@/app/api/assessment/profile/route'

// ── Per-block interpretation helpers (rule-based, 1–5 scale) ───

const PHASE_LABELS: Record<string, string> = {
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
  const base = s.overall >= 4.0
    ? 'Высокая самоэффективность — уверенность охватывает большинство фаз запуска.'
    : s.overall >= 3.0
      ? 'Средняя самоэффективность — есть сильные зоны и зоны роста.'
      : 'Повышенная осторожность — рекомендуется начать с минимального теста.'
  const hints: string[] = []
  if (s.opportunity_search >= 4.0) hints.push('Сильный поиск возможностей.')
  if (s.resource_mobilization > 0 && s.resource_mobilization < 3.0) hints.push('Низкая уверенность в мобилизации ресурсов.')
  if (s.finance_market_execution > 0 && s.finance_market_execution < 3.0) hints.push('Низкая уверенность в финансах и рынке.')
  if (s.planning >= 4.0) hints.push('Сильное планирование.')
  const summary = [base, ...hints.slice(0, 2)].join(' ')
  return sorted.length >= 2
    ? `${summary} Сильнее: ${PHASE_LABELS[strongest]}. Внимание: ${PHASE_LABELS[weakest]}.`
    : summary
}

const HEXACO_LABELS: Record<string, string> = {
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
  if (s.honesty_humility >= 4.0) hints.push('Высокая честность — низкий риск манипулятивных схем.')
  if (s.emotionality >= 4.0) hints.push('Высокая эмоциональность — нужны ритуалы восстановления.')
  if (s.extraversion >= 4.0) hints.push('Высокая экстраверсия — продажи и партнёрства даются легче.')
  if (s.conscientiousness >= 4.0) hints.push('Высокая добросовестность — сильная операционная дисциплина.')
  if (s.openness_to_experience >= 4.0) hints.push('Высокая открытость — готовность к нестандартным моделям.')
  if (s.extraversion > 0 && s.extraversion < 3.0) hints.push('Низкая экстраверсия — заложить больше времени на первые продажи.')
  if (s.conscientiousness > 0 && s.conscientiousness < 3.0) hints.push('Невысокая добросовестность — рекомендуется партнёр-оператор.')
  return [
    ...hints.slice(0, 2),
    `Выражены сильнее: ${top.map(k => HEXACO_LABELS[k]).join(', ')}.`,
    top[top.length - 1] !== bottom ? `Ниже среднего: ${HEXACO_LABELS[bottom]}.` : '',
  ].filter(Boolean).join(' ')
}

const VALUES_LABELS: Record<string, string> = {
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
  if (s.achievement_power >= 4.0) hints.push('Сильная ориентация на результат и влияние.')
  if (s.openness_self_direction >= 4.0) hints.push('Высокая самостоятельность в выборе модели.')
  if (s.universalism_benevolence >= 4.0) hints.push('Важна польза и справедливость.')
  if (s.ethics_rule_orientation >= 4.0) hints.push('Высокая склонность к белым схемам.')
  if (s.security >= 4.0) hints.push('Осторожный вход важен — нужна финансовая подушка.')
  if (s.hedonism >= 4.0) hints.push('Важно качество повседневной жизни.')
  if (s.security > 0 && s.security < 2.5) hints.push('Низкий приоритет безопасности — готов к высокому риску.')
  return [
    ...hints.slice(0, 2),
    `Выражено сильнее: ${VALUES_LABELS[top]}.`,
    top !== bottom ? `Ниже среднего: ${VALUES_LABELS[bottom]}.` : '',
  ].filter(Boolean).join(' ')
}

const IDENTITY_LABELS: Record<string, string> = {
  darwinian: 'Рыночная (Darwinian)',
  communitarian: 'Сообщество (Communitarian)',
  missionary: 'Миссионерская (Missionary)',
}
const MIXED_HINTS: Partial<Record<string, string>> = {
  'darwinian+missionary': 'Сочетание рыночной прагматики и стремления к влиянию через идею.',
  'missionary+darwinian': 'Сочетание рыночной прагматики и стремления к влиянию через идею.',
  'communitarian+missionary': 'Дело строится вокруг людей и ценностей одновременно.',
  'missionary+communitarian': 'Дело строится вокруг людей и ценностей одновременно.',
  'darwinian+communitarian': 'Ориентация на нишу с сильной рыночной прагматикой.',
  'communitarian+darwinian': 'Ориентация на нишу с сильной рыночной прагматикой.',
}
const IDENTITY_HINTS: Record<string, string> = {
  darwinian: 'Сильная ориентация на рост, прибыль, конкуренцию и эффективность.',
  communitarian: 'Сильная связка с конкретной аудиторией, нишей, отношениями и доверием.',
  missionary: 'Сильная опора на идею, ценности и смысл изменений.',
}

function interpretIdentity(s: IdentityScores): string {
  if (s.darwinian === 0 && s.communitarian === 0 && s.missionary === 0) return 'Ответы не заполнены.'
  if (s.isMixed && s.secondary) {
    const hint = MIXED_HINTS[`${s.dominant}+${s.secondary}`] ?? ''
    return [`Смешанный профиль: ${IDENTITY_LABELS[s.dominant]} и ${IDENTITY_LABELS[s.secondary]}.`, hint].filter(Boolean).join(' ')
  }
  return `Преобладает: ${IDENTITY_LABELS[s.dominant]}. ${IDENTITY_HINTS[s.dominant]}${s.secondary ? ` На втором месте: ${IDENTITY_LABELS[s.secondary]}.` : ''}`
}

const ENTRECOMP_LABELS: Record<string, string> = {
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
  if (s.ideation_opportunity >= 4.0) hints.push('Хорошо замечает возможности и формулирует идеи под рынок.')
  if (s.action_under_uncertainty >= 4.0) hints.push('Способен запускаться без идеальных условий и быстро адаптироваться.')
  if (s.ethical_orientation >= 4.0) hints.push('Учитывает последствия решений и держит ценностные границы.')
  if (s.ideation_opportunity > 0 && s.ideation_opportunity <= 2.0) hints.push('Слабая идеация — рекомендованы готовые модели, франшизы, copy-with-advantage.')
  else if (s.ideation_opportunity > 0 && s.ideation_opportunity < 3.0) hints.push('Поиск возможностей — зона роста.')
  if (s.action_under_uncertainty > 0 && s.action_under_uncertainty < 3.0) hints.push('Действие в неопределённости — зона роста: помогает MVP-подход.')
  return [
    ...hints.slice(0, 2),
    sorted.length >= 2
      ? `Выражено сильнее: ${ENTRECOMP_LABELS[sorted[0]]}. Ниже: ${ENTRECOMP_LABELS[sorted[sorted.length - 1]]}.`
      : `Выражено: ${ENTRECOMP_LABELS[sorted[0]]}.`,
  ].filter(Boolean).join(' ')
}

// ── Component ─────────────────────────────────────────────────

export default function AssessmentOverviewPage() {
  const [b1aiAnswers, setB1aiAnswers] = useState<Block1AIAnswers | null>(null)
  const [eseAnswers, setEseAnswers] = useState<ESEAnswers | null>(null)
  const [eseNoExp, setEseNoExp] = useState<ESENoExperience | null>(null)
  const [hexacoAnswers, setHexacoAnswers] = useState<HEXACOAnswers | null>(null)
  const [valuesAnswers, setValuesAnswers] = useState<ValuesAnswers | null>(null)
  const [identityAnswers, setIdentityAnswers] = useState<IdentityAnswers | null>(null)
  const [identityScenarios, setIdentityScenarios] = useState<IdentityScenarios | null>(null)
  const [entrecompV2Answers, setEntrecompV2Answers] = useState<EntreCompV2Answers | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [aiSynthesis, setAiSynthesis] = useState<AISynthesis | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    try {
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

  const eseHasData = !!(eseScores && eseScores.overall > 0)
  const hexacoHasData = !!(hexacoScores && hexacoScores.overall > 0)
  const valuesHasData = !!(valuesScores && valuesScores.overall > 0)
  const identityHasData = !!(identityScores && (identityScores.darwinian > 0 || identityScores.communitarian > 0 || identityScores.missionary > 0))
  const entrecompHasData = !!(entrecompScores && entrecompScores.overall > 0)

  // Stale data detection: all scales are 1–5; overall > 5.1 means old data (pre-scale-change)
  const eseStale = !!(eseScores && eseScores.overall > 5.1)
  const valuesStale = !!(valuesScores && valuesScores.overall > 5.1)

  const b1tags = b1aiAnswers
    ? Object.values(b1aiAnswers).map(a => a.finalTag).filter(Boolean)
    : []

  const profile = buildFounderProfile(
    eseScores, hexacoScores, valuesScores, identityScores, entrecompScores, b1tags
  )

  const allDone = profile.completedBlocks === 6
  const canGenerateAI = profile.completedBlocks >= 3

  const handleGenerateAI = async () => {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/assessment/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      })
      const data = await res.json()
      if (data.synthesis) setAiSynthesis(data.synthesis)
      else setAiError(data.error ?? 'Ошибка генерации')
    } catch {
      setAiError('Ошибка соединения с сервером')
    }
    setAiLoading(false)
  }

  if (!loaded) return null

  return (
    <div style={{ maxWidth: '700px' }}>

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

        <div style={{
          backgroundColor: allDone ? 'rgba(107,168,122,0.08)' : '#1F1A16',
          border: allDone ? '1px solid rgba(107,168,122,0.25)' : '1px solid rgba(181,122,86,0.20)',
          borderRadius: '18px', padding: '18px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: allDone ? '#6BA87A' : '#D09062', marginBottom: '4px' }}>
              {allDone ? 'Диагностика завершена' : `Заполнено ${profile.completedBlocks} из 6 блоков`}
            </div>
            {!allDone && (
              <div style={{ fontSize: '13px', color: '#9B8A7A' }}>
                Чем больше блоков заполнено, тем точнее профиль
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} style={{
                width: '10px', height: '10px', borderRadius: '50%',
                backgroundColor: n <= profile.completedBlocks ? '#6BA87A' : 'rgba(244,237,227,0.10)',
              }} />
            ))}
          </div>
        </div>

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

      {/* ── Единый профиль основателя ────────────────────── */}
      {profile.completedBlocks > 0 && (
        <>
          <div style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '28px' }}>
            ЕДИНЫЙ ПРОФИЛЬ ОСНОВАТЕЛЯ
          </div>

          {/* Ядро профиля */}
          <ProfileSection
            tag="1"
            title="Ядро профиля"
            subtitle="Кто этот основатель"
          >
            {aiSynthesis ? (
              <AIText>{aiSynthesis.coreProfile}</AIText>
            ) : (
              profile.coreProfile.length > 0
                ? profile.coreProfile.map((s, i) => <FactItem key={i} text={s} />)
                : <EmptyHint>Заполните блоки 2 (ESE) и 5 (Идентичность) для вывода ядра профиля</EmptyHint>
            )}
          </ProfileSection>

          {/* Сильные стороны */}
          {profile.strengths.length > 0 && (
            <ProfileSection
              tag="2"
              title="Сильные стороны"
              subtitle="Подтверждено данными"
              accent="green"
            >
              {aiSynthesis
                ? aiSynthesis.strengths.map((s, i) => <FactItem key={i} text={s} accent="green" />)
                : profile.strengths.map((f, i) => <FactItem key={i} text={f.text} source={f.source} accent="green" />)
              }
            </ProfileSection>
          )}

          {/* Рабочий стиль запуска */}
          <ProfileSection
            tag="3"
            title="Рабочий стиль запуска"
            subtitle="Как заходить в новое направление"
          >
            {aiSynthesis ? (
              <AIText>{aiSynthesis.launchStyle}</AIText>
            ) : (
              profile.launchStyle.map((f, i) => <FactItem key={i} text={f.text} source={f.source} />)
            )}
          </ProfileSection>

          {/* Ограничения и риски */}
          {profile.limitations.length > 0 && (
            <ProfileSection
              tag="4"
              title="Ограничения и риски"
              subtitle={profile.weakIdeation ? '⚠ Включает слабую идеацию (Б6)' : 'Честно, без сглаживания'}
              accent="amber"
            >
              {aiSynthesis
                ? aiSynthesis.limitations.map((s, i) => <FactItem key={i} text={s} accent="amber" />)
                : profile.limitations.map((f, i) => <FactItem key={i} text={f.text} source={f.source} accent="amber" />)
              }
            </ProfileSection>
          )}

          {/* Подходящие типы возможностей */}
          {profile.opportunityTypes.length > 0 && (
            <ProfileSection
              tag="5"
              title="Подходящие типы возможностей"
              subtitle="Что соответствует профилю"
            >
              {aiSynthesis
                ? aiSynthesis.opportunityTypes.map((s, i) => <FactItem key={i} text={s} />)
                : profile.opportunityTypes.map((f, i) => <FactItem key={i} text={f.text} source={f.source} />)
              }
            </ProfileSection>
          )}

          {/* Нежелательные сценарии */}
          {profile.warningScenarios.length > 0 && (
            <ProfileSection
              tag="6"
              title="Нежелательные сценарии"
              subtitle="Что противопоказано без компенсации"
              accent="red"
            >
              {aiSynthesis
                ? aiSynthesis.warningScenarios.map((s, i) => <FactItem key={i} text={s} accent="red" />)
                : profile.warningScenarios.map((f, i) => <FactItem key={i} text={f.text} source={f.source} accent="red" />)
              }
            </ProfileSection>
          )}

          {/* AI button */}
          {canGenerateAI && (
            <div style={{
              backgroundColor: '#1A1613', borderRadius: '16px',
              padding: '18px 22px', border: '1px solid rgba(244,237,227,0.08)',
              marginBottom: '48px',
            }}>
              {aiSynthesis ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, color: '#6BA87A',
                    backgroundColor: 'rgba(107,168,122,0.12)', padding: '3px 10px', borderRadius: '9px',
                  }}>AI-анализ активирован</span>
                  <span style={{ fontSize: '13px', color: '#6B5D52' }}>Текст сгенерирован и проверен</span>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '14px', color: '#CDBEAE', marginBottom: '12px' }}>
                    AI-слой переводит сухие факты в связный профиль.
                    {' '}<span style={{ color: '#6B5D52' }}>Данные — только из ваших ответов.</span>
                  </div>
                  {aiError && (
                    <div style={{ fontSize: '13px', color: '#D09062', marginBottom: '10px' }}>{aiError}</div>
                  )}
                  <button
                    onClick={handleGenerateAI}
                    disabled={aiLoading}
                    style={{
                      backgroundColor: aiLoading ? 'rgba(181,122,86,0.15)' : '#B57A56',
                      color: aiLoading ? '#9B8A7A' : '#F4EDE3',
                      border: 'none', borderRadius: '12px',
                      padding: '10px 20px', fontSize: '14px', fontWeight: 600,
                      cursor: aiLoading ? 'default' : 'pointer',
                    }}
                  >
                    {aiLoading ? 'Генерирую профиль...' : 'Сгенерировать AI-анализ →'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Разделитель ─────────────────────────────────────── */}
      <div style={{ height: '1px', backgroundColor: 'rgba(244,237,227,0.06)', margin: '8px 0 36px' }} />

      <div style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '32px' }}>
        РАЗБОР ПО БЛОКАМ — ДОКАЗАТЕЛЬНАЯ БАЗА
      </div>

      {/* Block 1 */}
      {b1tags.length > 0
        ? <Block1Detail tags={b1tags} />
        : <IncompleteBlock label="Блок 1 · Опыт, связи и ресурсы" href="/assessment/founder-intake" />
      }

      {/* Block 2 ESE */}
      {eseHasData && (
        <BlockDetail title="Блок 2 · ESE — Предпринимательская самоэффективность">
          {eseStale && <StaleWarning href="/assessment/ese" />}
          {!eseStale && (
            <>
              <ScoreWithBars overall={eseScores!.overall} overallMax={5} overallLabel="СРЕДНИЙ / 5">
                {PHASE_KEYS.map(k => <MiniBar key={k} label={PHASE_LABELS[k]} score={eseScores![k]} max={5} />)}
              </ScoreWithBars>
              <InterpText>{interpretESE(eseScores!)}</InterpText>
            </>
          )}
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
          {valuesStale && <StaleWarning href="/assessment/values" />}
          {!valuesStale && (
            <>
              <ScoreWithBars overall={valuesScores!.overall} overallMax={5} overallLabel="СРЕДНИЙ / 5">
                {VALUES_KEYS.map(k => <MiniBar key={k} label={VALUES_LABELS[k]} score={valuesScores![k]} max={5} />)}
              </ScoreWithBars>
              <InterpText>{interpretValues(valuesScores!)}</InterpText>
            </>
          )}
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
          Расчёт детерминированный: те же ответы дают тот же результат.
          После подключения системы оценки профиль будет включён в scoring возможностей.
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

// ── Block1Detail ──────────────────────────────────────────────

// Tag categories for grouped display
const B1_CATEGORIES: { label: string; tags: string[] }[] = [
  { label: 'Навыки и сила', tags: ['commercial_strength', 'execution_strength', 'product_build_signal', 'finance_signal', 'analytical_signal', 'team_lead_signal', 'service_fit'] },
  { label: 'Доступ к рынку', tags: ['market_access', 'distribution_access', 'partner_access', 'audience_access'] },
  { label: 'Стиль запуска', tags: ['solo_start_fit', 'product_fit', 'partner_led_fit', 'low_risk_entry_fit', 'speed_need'] },
  { label: 'Ресурсы и риск', tags: ['capital_capacity', 'risk_tolerance'] },
]

function Block1Detail({ tags }: { tags: string[] }) {
  // Deduplicate, filter out no_signal
  const uniqueTags = [...new Set(tags)].filter(t => t !== 'no_signal')
  const noSignalCount = tags.filter(t => t === 'no_signal').length

  if (uniqueTags.length === 0) {
    return (
      <BlockDetail title="Блок 1 · Опыт, связи и ресурсы">
        <div style={{
          backgroundColor: '#141210', borderRadius: '14px', padding: '16px 18px',
          border: '1px solid rgba(244,237,227,0.05)',
        }}>
          <p style={{ fontSize: '13px', color: '#6B5D52', fontStyle: 'italic' }}>
            Данные по опыту и связям требуют уточнения — подтверждённых сигналов не получено
          </p>
        </div>
      </BlockDetail>
    )
  }

  // Group tags by category
  const grouped: { label: string; items: string[] }[] = []
  for (const cat of B1_CATEGORIES) {
    const items = uniqueTags.filter(t => cat.tags.includes(t))
    if (items.length > 0) grouped.push({ label: cat.label, items })
  }
  // Uncategorised
  const categorised = B1_CATEGORIES.flatMap(c => c.tags)
  const other = uniqueTags.filter(t => !categorised.includes(t))
  if (other.length > 0) grouped.push({ label: 'Прочее', items: other })

  return (
    <BlockDetail title="Блок 1 · Опыт, связи и ресурсы">
      <div style={{
        backgroundColor: '#1F1A16', borderRadius: '14px', padding: '16px 18px',
        border: '1px solid rgba(181,122,86,0.18)', marginBottom: '8px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        {grouped.map((g, gi) => (
          <div key={gi}>
            <div style={{ fontSize: '11px', color: '#6B5D52', letterSpacing: '0.05em', marginBottom: '6px' }}>
              {g.label.toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {g.items.map((tag, i) => (
                <span key={i} style={{
                  fontSize: '13px', fontWeight: 500, color: '#D09062',
                  backgroundColor: 'rgba(181,122,86,0.12)',
                  padding: '4px 12px', borderRadius: '9px',
                }}>
                  {AI_TAG_LABELS[tag] ?? tag}
                </span>
              ))}
            </div>
          </div>
        ))}
        {noSignalCount > 0 && (
          <p style={{ fontSize: '12px', color: '#4A3A2A', marginTop: '4px' }}>
            {noSignalCount} {noSignalCount === 1 ? 'вопрос' : 'вопроса'} без подтверждённого сигнала
          </p>
        )}
      </div>
    </BlockDetail>
  )
}

// ── Sub-components ────────────────────────────────────────────

function ProfileSection({
  tag, title, subtitle, accent, children,
}: {
  tag: string; title: string; subtitle: string; accent?: 'green' | 'amber' | 'red'; children: React.ReactNode
}) {
  const colors = {
    green: { bg: 'rgba(107,168,122,0.08)', border: 'rgba(107,168,122,0.20)', badge: 'rgba(107,168,122,0.18)', text: '#6BA87A' },
    amber: { bg: 'rgba(181,122,86,0.07)', border: 'rgba(181,122,86,0.20)', badge: 'rgba(181,122,86,0.18)', text: '#D09062' },
    red:   { bg: 'rgba(200,80,60,0.07)',  border: 'rgba(200,80,60,0.20)',  badge: 'rgba(200,80,60,0.15)',  text: '#C8503C' },
    none:  { bg: 'rgba(181,122,86,0.07)', border: 'rgba(181,122,86,0.18)', badge: 'rgba(181,122,86,0.15)', text: '#D09062' },
  }
  const c = colors[accent ?? 'none']
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <div style={{
          width: '22px', height: '22px', borderRadius: '6px',
          backgroundColor: c.badge, border: `1px solid ${c.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: c.text }}>{tag}</span>
        </div>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#F4EDE3' }}>{title}</h2>
      </div>
      <div style={{ fontSize: '12px', color: '#6B5D52', marginBottom: '12px', paddingLeft: '32px' }}>
        {subtitle}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '0' }}>
        {children}
      </div>
    </div>
  )
}

function FactItem({ text, source, accent }: { text: string; source?: string; accent?: 'green' | 'amber' | 'red' }) {
  const colors = {
    green: { bg: 'rgba(107,168,122,0.07)', border: 'rgba(107,168,122,0.15)', icon: '✓', iconColor: '#6BA87A' },
    amber: { bg: 'rgba(181,122,86,0.07)', border: 'rgba(181,122,86,0.15)', icon: '◆', iconColor: '#B57A56' },
    red:   { bg: 'rgba(200,80,60,0.07)',  border: 'rgba(200,80,60,0.15)',  icon: '✕', iconColor: '#C8503C' },
    none:  { bg: '#1A1613',               border: 'rgba(244,237,227,0.08)', icon: '→', iconColor: '#9B8A7A' },
  }
  const c = colors[accent ?? 'none']
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      backgroundColor: c.bg, border: `1px solid ${c.border}`,
      borderRadius: '14px', padding: '12px 16px',
    }}>
      <span style={{ color: c.iconColor, fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>{c.icon}</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.5 }}>{text}</span>
        {source && (
          <span style={{
            marginLeft: '8px', fontSize: '11px', color: '#6B5D52',
            backgroundColor: 'rgba(244,237,227,0.05)',
            padding: '1px 7px', borderRadius: '6px',
          }}>{source}</span>
        )}
      </div>
    </div>
  )
}

function AIText({ children }: { children: string }) {
  return (
    <div style={{
      backgroundColor: '#1F1A16', border: '1px solid rgba(181,122,86,0.20)',
      borderRadius: '16px', padding: '18px 20px',
    }}>
      <p style={{ fontSize: '15px', color: '#F4EDE3', lineHeight: 1.65 }}>{children}</p>
    </div>
  )
}

function EmptyHint({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: '13px', color: '#4A3A2A', fontStyle: 'italic',
      padding: '12px 16px', backgroundColor: '#141210',
      borderRadius: '12px', border: '1px solid rgba(244,237,227,0.04)',
    }}>
      {children}
    </div>
  )
}

function StaleWarning({ href }: { href: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      backgroundColor: 'rgba(217,119,6,0.08)', borderRadius: '12px', padding: '12px 16px',
      border: '1px solid rgba(217,119,6,0.25)',
    }}>
      <span style={{ fontSize: '13px', color: '#D09062' }}>
        Данные блока сохранены по старой шкале — требуется пересдача
      </span>
      <Link href={href} style={{ textDecoration: 'none', flexShrink: 0 }}>
        <span style={{
          fontSize: '12px', fontWeight: 600, color: '#B57A56',
          backgroundColor: 'rgba(181,122,86,0.15)',
          padding: '4px 12px', borderRadius: '9px',
        }}>
          Сбросить и пройти →
        </span>
      </Link>
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
          width: score > 0 ? `${Math.min(100, (score / max) * 100)}%` : '0%',
          backgroundColor: '#B57A56', borderRadius: '2px',
        }} />
      </div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#D09062', width: '26px', textAlign: 'right' }}>
        {score > 0 ? score.toFixed(1) : '—'}
      </div>
    </div>
  )
}

function InterpText({ children }: { children: string }) {
  return (
    <p style={{
      fontSize: '13px', color: '#9B8A7A', lineHeight: 1.6,
      backgroundColor: '#141210', borderRadius: '12px',
      padding: '12px 16px', border: '1px solid rgba(244,237,227,0.04)',
    }}>
      {children}
    </p>
  )
}
