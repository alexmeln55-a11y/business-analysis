'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { INTAKE_STORAGE_KEY, type FounderIntakeAnswers } from '../founder-intake/page'

// ── Derived insight logic (mock, no backend) ──────────────────

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

    time_resource: timeAnswer.length > 2
      ? timeAnswer.slice(0, 80)
      : 'Время не указано.',

    budget_resource: budgetAnswer.length > 2
      ? budgetAnswer.slice(0, 80)
      : 'Бюджет не указан.',

    manual_readiness: hasTeam
      ? 'Есть поддержка на старте: ' + answers.q15.slice(0, 80)
      : 'Скорее всего старт в одиночку — рекомендуется manual_first режим.',
  }
}

// ── Component ─────────────────────────────────────────────────

export default function AssessmentOverviewPage() {
  const [answers, setAnswers] = useState<FounderIntakeAnswers | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(INTAKE_STORAGE_KEY)
      if (saved) setAnswers(JSON.parse(saved))
    } catch {}
    setLoaded(true)
  }, [])

  const insights = deriveInsights(answers)

  if (!loaded) return null

  return (
    <div style={{ maxWidth: '680px' }}>

      {/* Back */}
      <Link href="/assessment/founder-intake" style={{
        fontSize: '14px',
        color: '#9B8A7A',
        textDecoration: 'none',
        display: 'inline-block',
        marginBottom: '32px',
      }}>
        ← Редактировать ответы
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '10px' }}>
          БЛОК 1 ЗАВЕРШЁН
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#F4EDE3', lineHeight: 1.25, marginBottom: '12px' }}>
          Итог: Опыт, связи и ресурсы
        </h1>
        <p style={{ fontSize: '15px', color: '#CDBEAE', lineHeight: 1.6 }}>
          На основе ваших ответов система выделила ключевые параметры. Они будут учтены при оценке возможностей.
        </p>
      </div>

      {/* Insights */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
        <InsightRow
          label="Сильные практические навыки"
          value={insights.strong_skills}
          icon="◈"
        />
        <InsightRow
          label="Доступ к рынку"
          value={insights.market_access}
          icon="◎"
        />
        <InsightRow
          label="Ресурс времени"
          value={insights.time_resource}
          icon="◷"
        />
        <InsightRow
          label="Ресурс денег"
          value={insights.budget_resource}
          icon="◉"
        />
        <InsightRow
          label="Готовность к ручному старту"
          value={insights.manual_readiness}
          icon="◌"
        />
      </div>

      {/* Note */}
      <div style={{
        backgroundColor: '#1A1613',
        borderRadius: '16px',
        padding: '18px 22px',
        border: '1px solid rgba(244,237,227,0.07)',
        marginBottom: '40px',
      }}>
        <p style={{ fontSize: '13px', color: '#9B8A7A', lineHeight: 1.6 }}>
          Это предварительный разбор на основе текста ваших ответов.
          После подключения системы оценки параметры будут верифицированы и включены в scoring.
        </p>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link href="/discovery" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%',
            backgroundColor: '#B57A56',
            color: '#F4EDE3',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 28px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>Перейти к запросу возможностей</span>
            <span>→</span>
          </button>
        </Link>

        <Link href="/assessment" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%',
            backgroundColor: 'transparent',
            color: '#9B8A7A',
            border: '1px solid rgba(244,237,227,0.10)',
            borderRadius: '16px',
            padding: '14px 28px',
            fontSize: '14px',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}>
            <span>Продолжить диагностику позже</span>
            <span style={{ fontSize: '12px' }}>Блоки 2–6 появятся позже</span>
          </button>
        </Link>
      </div>

    </div>
  )
}

function InsightRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{
      backgroundColor: '#1A1613',
      borderRadius: '16px',
      padding: '18px 20px',
      border: '1px solid rgba(244,237,227,0.08)',
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start',
    }}>
      <span style={{
        fontSize: '16px',
        color: '#B57A56',
        flexShrink: 0,
        marginTop: '2px',
        opacity: 0.7,
      }}>
        {icon}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '6px' }}>
          {label.toUpperCase()}
        </div>
        <p style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.6 }}>{value}</p>
      </div>
    </div>
  )
}
