'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { INTAKE_STORAGE_KEY, ESE_STORAGE_KEY, calcESEScores, type FounderIntakeAnswers, type ESEAnswers, type ESEScores } from '@/lib/assessment'

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

// ── Component ─────────────────────────────────────────────────

export default function AssessmentOverviewPage() {
  const [b1Answers, setB1Answers] = useState<FounderIntakeAnswers | null>(null)
  const [eseAnswers, setEseAnswers] = useState<ESEAnswers | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const s1 = localStorage.getItem(INTAKE_STORAGE_KEY)
      if (s1) setB1Answers(JSON.parse(s1))
      const s2 = localStorage.getItem(ESE_STORAGE_KEY)
      if (s2) setEseAnswers(JSON.parse(s2))
    } catch {}
    setLoaded(true)
  }, [])

  const insights = deriveInsights(b1Answers)
  const eseScores = eseAnswers ? calcESEScores(eseAnswers) : null
  const eseHasData = eseScores && eseScores.overall > 0

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
            <span style={{ fontSize: '12px' }}>Блоки 3–6 появятся позже</span>
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
