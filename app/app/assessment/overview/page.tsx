'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { INTAKE_STORAGE_KEY, ESE_STORAGE_KEY, HEXACO_STORAGE_KEY, VALUES_STORAGE_KEY, calcESEScores, calcHEXACOScores, calcValuesScores, type FounderIntakeAnswers, type ESEAnswers, type ESEScores, type HEXACOAnswers, type HEXACOScores, type ValuesAnswers, type ValuesScores } from '@/lib/assessment'

// ── Block 1 insight logic ─────────────────────────────────────

interface FounderInsight {
  strong_skills: string
  market_access: string
  time_resource: string
  budget_resource: string
  manual_readiness: string
}

function deriveInsights(answers: FounderIntakeAnswers | null): FounderInsight {
  if (!answers) {
    return {
      strong_skills: 'Данные не заполнены. Пройдите диагностику.',
      market_access: 'Данные не заполнены.',
      time_resource: 'Данные не заполнены.',
      budget_resource: 'Данные не заполнены.',
      manual_readiness: 'Данные не заполнены.',
    }
  }
  const hasPracticalSkills = answers.q1.trim().length > 10 || answers.q2.trim().length > 10
  const hasMarketContacts = answers.q5.trim().length > 5 || answers.q6.trim().length > 5
  const hasAudience = answers.q8.trim().length > 5
  const timeAnswer = answers.q13.trim()
  const budgetAnswer = answers.q14.trim()
  const hasTeam = answers.q15.trim().length > 5
  return {
    strong_skills: hasPracticalSkills
      ? (answers.q1.trim() || answers.q2.trim()).slice(0, 120) + (answers.q1.length > 120 ? '…' : '')
      : 'Не указаны конкретные навыки — стоит уточнить.',
    market_access: hasMarketContacts
      ? (answers.q5.trim() || answers.q6.trim()).slice(0, 120) + '…'
      : hasAudience
        ? 'Есть доступ к аудитории: ' + answers.q8.slice(0, 80)
        : 'Рыночные связи не описаны — рекомендуется уточнить перед запросом.',
    time_resource: timeAnswer.length > 2 ? timeAnswer.slice(0, 80) : 'Время не указано.',
    budget_resource: budgetAnswer.length > 2 ? budgetAnswer.slice(0, 80) : 'Бюджет не указан.',
    manual_readiness: hasTeam
      ? 'Есть поддержка на старте: ' + answers.q15.slice(0, 80)
      : 'Скорее всего старт в одиночку — рекомендуется manual_first режим.',
  }
}

// ── Block 2 ESE interpretation ────────────────────────────────

const PHASE_LABELS: Record<keyof Omit<ESEScores, 'overall'>, string> = {
  opportunity_search: 'Поиск возможностей',
  planning: 'Планирование',
  resource_mobilization: 'Мобилизация ресурсов',
  people_execution: 'Реализация — люди',
  finance_market_execution: 'Реализация — финансы и рынок',
}

const PHASE_KEYS = Object.keys(PHASE_LABELS) as Array<keyof Omit<ESEScores, 'overall'>>

function interpretESE(scores: ESEScores): string {
  const sorted = PHASE_KEYS
    .filter(k => scores[k] > 0)
    .sort((a, b) => scores[b] - scores[a])

  if (sorted.length === 0) return 'Ответы не заполнены.'

  const strongest = sorted[0]
  const weakest = sorted[sorted.length - 1]
  const overall = scores.overall

  let base = ''
  if (overall >= 5.5) base = 'Высокая самоэффективность — уверенность охватывает большинство фаз запуска.'
  else if (overall >= 4) base = 'Средняя самоэффективность — есть сильные зоны и зоны роста.'
  else base = 'Повышенная осторожность — рекомендуется начать с минимального теста и быстрого цикла обратной связи.'

  const hints: string[] = []
  if (scores.opportunity_search >= 5.5) hints.push('Сильный поиск возможностей — хорошая база для обнаружения ниш.')
  if (scores.resource_mobilization < 4 && scores.resource_mobilization > 0) hints.push('Низкая уверенность в мобилизации ресурсов — возможен риск на этапе сборки команды.')
  if (scores.finance_market_execution < 4 && scores.finance_market_execution > 0) hints.push('Низкая уверенность в финансах и рынке — рекомендуется осторожный вход и короткие тесты.')
  if (scores.planning >= 5) hints.push('Сильное планирование — можно опираться на структуру при запуске.')
  if (scores.people_execution < 4 && scores.people_execution > 0) hints.push('Стоит рассмотреть solo-режим или партнёрство с сильным оператором.')

  const summary = [base, ...hints.slice(0, 2)].join(' ')
  if (sorted.length >= 2) {
    return `${summary} Сильнее всего: ${PHASE_LABELS[strongest]}. Требует внимания: ${PHASE_LABELS[weakest]}.`
  }
  return summary
}

// ── Block 3 HEXACO interpretation ────────────────────────────

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
  const top = sorted.slice(0, 2)
  const bottom = sorted[sorted.length - 1]

  const hints: string[] = []
  if (s.honesty_humility >= 4) hints.push('Высокая честность — низкий риск манипулятивных продаж.')
  if (s.emotionality >= 4) hints.push('Высокая эмоциональность — нужны ритуалы восстановления в моменты неопределённости.')
  if (s.extraversion >= 4) hints.push('Высокая экстраверсия — продажи и партнёрства скорее всего даются легко.')
  if (s.conscientiousness >= 4) hints.push('Высокая добросовестность — сильная операционная дисциплина и управляемость.')
  if (s.openness_to_experience >= 4) hints.push('Высокая открытость — готовность к нестандартным моделям и экспериментам.')
  if (s.extraversion < 3 && s.extraversion > 0) hints.push('Низкая экстраверсия — стоит заложить больше времени на первые продажи.')
  if (s.conscientiousness < 3 && s.conscientiousness > 0) hints.push('Невысокая добросовестность — рекомендуется партнёр с сильной операционной функцией.')

  const topStr = top.map(k => HEXACO_LABELS[k]).join(', ')
  const bottomStr = HEXACO_LABELS[bottom]

  return [
    ...hints.slice(0, 2),
    `Выражены сильнее: ${topStr}.`,
    top[top.length - 1] !== bottom ? `Ниже среднего: ${bottomStr}.` : '',
  ].filter(Boolean).join(' ')
}

// ── Block 4 Values interpretation ────────────────────────────

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
  const top = sorted[0]
  const bottom = sorted[sorted.length - 1]

  const hints: string[] = []
  if (s.achievement_power >= 4.5) hints.push('Сильная ориентация на результат и влияние — хорошо подходит для амбициозных ниш.')
  if (s.openness_self_direction >= 4.5) hints.push('Высокая самостоятельность — важна свобода в выборе модели и партнёров.')
  if (s.universalism_benevolence >= 4.5) hints.push('Важна польза и справедливость — это фактор доверия с клиентами и командой.')
  if (s.ethics_rule_orientation >= 4.5) hints.push('Высокая склонность к белым схемам — снижает юридические риски на старте.')
  if (s.security >= 4.5) hints.push('Осторожный вход важен — стоит планировать финансовую подушку до запуска.')
  if (s.hedonism >= 4.5) hints.push('Важно качество повседневной жизни — подходят модели с гибким графиком.')
  if (s.security < 3 && s.security > 0) hints.push('Низкий приоритет безопасности — готов к высокому риску, но стоит закладывать стоп-лосс.')
  if (s.openness_self_direction < 3 && s.openness_self_direction > 0) hints.push('Ниже среднего открытость — предпочтительны стабильные, предсказуемые форматы.')

  return [
    ...hints.slice(0, 2),
    `Выражено сильнее: ${VALUES_LABELS[top]}.`,
    top !== bottom ? `Ниже среднего: ${VALUES_LABELS[bottom]}.` : '',
  ].filter(Boolean).join(' ')
}

// ── Component ─────────────────────────────────────────────────

export default function AssessmentOverviewPage() {
  const [b1Answers, setB1Answers] = useState<FounderIntakeAnswers | null>(null)
  const [eseAnswers, setEseAnswers] = useState<ESEAnswers | null>(null)
  const [hexacoAnswers, setHexacoAnswers] = useState<HEXACOAnswers | null>(null)
  const [valuesAnswers, setValuesAnswers] = useState<ValuesAnswers | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const s1 = localStorage.getItem(INTAKE_STORAGE_KEY)
      if (s1) setB1Answers(JSON.parse(s1))
      const s2 = localStorage.getItem(ESE_STORAGE_KEY)
      if (s2) setEseAnswers(JSON.parse(s2))
      const s3 = localStorage.getItem(HEXACO_STORAGE_KEY)
      if (s3) setHexacoAnswers(JSON.parse(s3))
      const s4 = localStorage.getItem(VALUES_STORAGE_KEY)
      if (s4) setValuesAnswers(JSON.parse(s4))
    } catch {}
    setLoaded(true)
  }, [])

  const insights = deriveInsights(b1Answers)
  const eseScores = eseAnswers ? calcESEScores(eseAnswers) : null
  const eseHasData = eseScores && eseScores.overall > 0
  const hexacoScores = hexacoAnswers ? calcHEXACOScores(hexacoAnswers) : null
  const hexacoHasData = hexacoScores && hexacoScores.overall > 0
  const valuesScores = valuesAnswers ? calcValuesScores(valuesAnswers) : null
  const valuesHasData = valuesScores && valuesScores.overall > 0

  if (!loaded) return null

  return (
    <div style={{ maxWidth: '680px' }}>

      {/* Back */}
      <Link href="/assessment/founder-intake" style={{
        fontSize: '14px', color: '#9B8A7A', textDecoration: 'none', display: 'inline-block', marginBottom: '32px',
      }}>
        ← Редактировать ответы
      </Link>

      {/* ── Block 1 summary ────────────────────────────────── */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '10px' }}>
          БЛОК 1 · ОПЫТ, СВЯЗИ И РЕСУРСЫ
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F4EDE3', lineHeight: 1.25, marginBottom: '20px' }}>
          Итог: Опыт, связи и ресурсы
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <InsightRow label="Сильные практические навыки" value={insights.strong_skills} icon="◈" />
          <InsightRow label="Доступ к рынку" value={insights.market_access} icon="◎" />
          <InsightRow label="Ресурс времени" value={insights.time_resource} icon="◷" />
          <InsightRow label="Ресурс денег" value={insights.budget_resource} icon="◉" />
          <InsightRow label="Готовность к ручному старту" value={insights.manual_readiness} icon="◌" />
        </div>
      </div>

      <Divider />

      {/* ── Block 2 summary ────────────────────────────────── */}
      {eseHasData ? (
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '10px' }}>
            БЛОК 2 · ESE — ПРЕДПРИНИМАТЕЛЬСКАЯ САМОЭФФЕКТИВНОСТЬ
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F4EDE3', lineHeight: 1.25, marginBottom: '20px' }}>
            Итог: Уровень уверенности
          </h2>

          {/* Overall score */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '20px',
            backgroundColor: '#1F1A16',
            borderRadius: '18px',
            padding: '18px 22px',
            border: '1px solid rgba(181,122,86,0.20)',
            marginBottom: '16px',
          }}>
            <div>
              <div style={{ fontSize: '42px', fontWeight: 700, color: '#D09062', lineHeight: 1 }}>
                {eseScores!.overall.toFixed(1)}
              </div>
              <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.06em', marginTop: '4px' }}>
                СРЕДНИЙ БАЛЛ / 7
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <ESEBar label="Поиск возможностей" score={eseScores!.opportunity_search} />
              <ESEBar label="Планирование" score={eseScores!.planning} />
              <ESEBar label="Мобилизация ресурсов" score={eseScores!.resource_mobilization} />
              <ESEBar label="Реализация — люди" score={eseScores!.people_execution} />
              <ESEBar label="Финансы и рынок" score={eseScores!.finance_market_execution} />
            </div>
          </div>

          {/* Interpretation */}
          <div style={{
            backgroundColor: '#1A1613',
            borderRadius: '14px',
            padding: '16px 20px',
            border: '1px solid rgba(244,237,227,0.07)',
          }}>
            <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '8px' }}>
              ИНТЕРПРЕТАЦИЯ
            </div>
            <p style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.65 }}>
              {interpretESE(eseScores!)}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '48px', opacity: 0.6 }}>
          <div style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '10px' }}>
            БЛОК 2 · ESE
          </div>
          <div style={{
            backgroundColor: '#141210',
            borderRadius: '16px',
            padding: '20px 24px',
            border: '1px solid rgba(244,237,227,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
          }}>
            <p style={{ fontSize: '14px', color: '#6B5D52' }}>Блок 2 ещё не пройден</p>
            <Link href="/assessment/ese" style={{ textDecoration: 'none' }}>
              <span style={{
                fontSize: '13px', fontWeight: 600, color: '#B57A56',
                backgroundColor: 'rgba(181,122,86,0.12)',
                padding: '6px 14px', borderRadius: '12px',
              }}>
                Пройти →
              </span>
            </Link>
          </div>
        </div>
      )}

      <Divider />

      {/* ── Block 3 HEXACO summary ─────────────────────────── */}
      {hexacoHasData ? (
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '10px' }}>
            БЛОК 3 · HEXACO — ЛИЧНОСТНЫЙ ПРОФИЛЬ
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F4EDE3', lineHeight: 1.25, marginBottom: '20px' }}>
            Итог: Личностный профиль
          </h2>

          {/* Overall + factor bars */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '20px',
            backgroundColor: '#1F1A16', borderRadius: '18px', padding: '18px 22px',
            border: '1px solid rgba(181,122,86,0.20)', marginBottom: '16px',
          }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '42px', fontWeight: 700, color: '#D09062', lineHeight: 1 }}>
                {hexacoScores!.overall.toFixed(1)}
              </div>
              <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.06em', marginTop: '4px' }}>
                СРЕДНИЙ / 5
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {HEXACO_KEYS.map(k => (
                <HEXACOBar key={k} label={HEXACO_LABELS[k]} score={hexacoScores![k]} max={5} />
              ))}
            </div>
          </div>

          {/* Interpretation */}
          <div style={{
            backgroundColor: '#1A1613', borderRadius: '14px', padding: '16px 20px',
            border: '1px solid rgba(244,237,227,0.07)',
          }}>
            <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '8px' }}>
              ПРИКЛАДНАЯ ИНТЕРПРЕТАЦИЯ
            </div>
            <p style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.65 }}>
              {interpretHEXACO(hexacoScores!)}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '48px', opacity: 0.6 }}>
          <div style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '10px' }}>
            БЛОК 3 · HEXACO
          </div>
          <div style={{
            backgroundColor: '#141210', borderRadius: '16px', padding: '20px 24px',
            border: '1px solid rgba(244,237,227,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
          }}>
            <p style={{ fontSize: '14px', color: '#6B5D52' }}>Блок 3 ещё не пройден</p>
            <Link href="/assessment/hexaco" style={{ textDecoration: 'none' }}>
              <span style={{
                fontSize: '13px', fontWeight: 600, color: '#B57A56',
                backgroundColor: 'rgba(181,122,86,0.12)',
                padding: '6px 14px', borderRadius: '12px',
              }}>
                Пройти →
              </span>
            </Link>
          </div>
        </div>
      )}

      <Divider />

      {/* ── Block 4 Values summary ─────────────────────────── */}
      {valuesHasData ? (
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '10px' }}>
            БЛОК 4 · ЦЕННОСТИ — SCHWARTZ PVQ-RR
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F4EDE3', lineHeight: 1.25, marginBottom: '20px' }}>
            Итог: Ценностный профиль
          </h2>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '20px',
            backgroundColor: '#1F1A16', borderRadius: '18px', padding: '18px 22px',
            border: '1px solid rgba(181,122,86,0.20)', marginBottom: '16px',
          }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '42px', fontWeight: 700, color: '#D09062', lineHeight: 1 }}>
                {valuesScores!.overall.toFixed(1)}
              </div>
              <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.06em', marginTop: '4px' }}>
                СРЕДНИЙ / 6
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {VALUES_KEYS.map(k => (
                <HEXACOBar key={k} label={VALUES_LABELS[k]} score={valuesScores![k]} max={6} />
              ))}
            </div>
          </div>

          <div style={{
            backgroundColor: '#1A1613', borderRadius: '14px', padding: '16px 20px',
            border: '1px solid rgba(244,237,227,0.07)',
          }}>
            <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '8px' }}>
              ПРИКЛАДНАЯ ИНТЕРПРЕТАЦИЯ
            </div>
            <p style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.65 }}>
              {interpretValues(valuesScores!)}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '48px', opacity: 0.6 }}>
          <div style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '10px' }}>
            БЛОК 4 · ЦЕННОСТИ
          </div>
          <div style={{
            backgroundColor: '#141210', borderRadius: '16px', padding: '20px 24px',
            border: '1px solid rgba(244,237,227,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
          }}>
            <p style={{ fontSize: '14px', color: '#6B5D52' }}>Блок 4 ещё не пройден</p>
            <Link href="/assessment/values" style={{ textDecoration: 'none' }}>
              <span style={{
                fontSize: '13px', fontWeight: 600, color: '#B57A56',
                backgroundColor: 'rgba(181,122,86,0.12)',
                padding: '6px 14px', borderRadius: '12px',
              }}>
                Пройти →
              </span>
            </Link>
          </div>
        </div>
      )}

      <Divider />

      {/* Note */}
      <div style={{
        backgroundColor: '#1A1613', borderRadius: '16px', padding: '18px 22px',
        border: '1px solid rgba(244,237,227,0.07)', marginBottom: '40px',
      }}>
        <p style={{ fontSize: '13px', color: '#9B8A7A', lineHeight: 1.6 }}>
          Это предварительный разбор на основе ваших ответов.
          После подключения системы оценки параметры будут включены в scoring возможностей.
        </p>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link href="/discovery" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%', backgroundColor: '#B57A56', color: '#F4EDE3',
            border: 'none', borderRadius: '16px', padding: '16px 28px',
            fontSize: '15px', fontWeight: 600, cursor: 'pointer',
            textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>Перейти к запросу возможностей</span>
            <span>→</span>
          </button>
        </Link>
        <Link href="/assessment" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%', backgroundColor: 'transparent', color: '#9B8A7A',
            border: '1px solid rgba(244,237,227,0.10)', borderRadius: '16px',
            padding: '14px 28px', fontSize: '14px', cursor: 'pointer',
            textAlign: 'left', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', boxSizing: 'border-box',
          }}>
            <span>Продолжить диагностику позже</span>
            <span style={{ fontSize: '12px' }}>Блоки 5–6 появятся позже</span>
          </button>
        </Link>
      </div>

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function Divider() {
  return <div style={{ height: '1px', backgroundColor: 'rgba(244,237,227,0.06)', marginBottom: '48px' }} />
}

function InsightRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{
      backgroundColor: '#1A1613', borderRadius: '16px', padding: '16px 20px',
      border: '1px solid rgba(244,237,227,0.08)', display: 'flex', gap: '16px', alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '15px', color: '#B57A56', flexShrink: 0, marginTop: '2px', opacity: 0.7 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '5px' }}>
          {label.toUpperCase()}
        </div>
        <p style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.6 }}>{value}</p>
      </div>
    </div>
  )
}

function ESEBar({ label, score }: { label: string; score: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
      <div style={{ fontSize: '12px', color: '#9B8A7A', width: '170px', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: 'rgba(244,237,227,0.08)' }}>
        <div style={{
          height: '100%',
          width: score > 0 ? `${(score / 7) * 100}%` : '0%',
          backgroundColor: '#B57A56',
          borderRadius: '2px',
        }} />
      </div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#D09062', width: '28px', textAlign: 'right' }}>
        {score > 0 ? score.toFixed(1) : '—'}
      </div>
    </div>
  )
}

function HEXACOBar({ label, score, max }: { label: string; score: number; max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
      <div style={{ fontSize: '12px', color: '#9B8A7A', width: '170px', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: 'rgba(244,237,227,0.08)' }}>
        <div style={{
          height: '100%',
          width: score > 0 ? `${(score / max) * 100}%` : '0%',
          backgroundColor: '#B57A56',
          borderRadius: '2px',
        }} />
      </div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#D09062', width: '28px', textAlign: 'right' }}>
        {score > 0 ? score.toFixed(1) : '—'}
      </div>
    </div>
  )
}
