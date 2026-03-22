'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ESE_STORAGE_KEY, type ESEAnswers } from '@/lib/assessment'

// ── Sections ──────────────────────────────────────────────────

const EMPTY: ESEAnswers = {
  q1: 0, q2: 0, q3: 0,
  q4: 0, q5: 0, q6: 0,
  q7: 0, q8: 0, q9: 0,
  q10: 0, q11: 0, q12: 0,
  q13: 0, q14: 0, q15: 0,
}

const PHASES = [
  {
    number: 1,
    title: 'Поиск возможностей',
    questions: [
      { key: 'q1' as const, text: 'Насколько вы уверены, что сможете заметить перспективную рыночную возможность, прежде чем это сделают другие?' },
      { key: 'q2' as const, text: 'Насколько вы уверены, что сможете оценить, есть ли платежеспособный спрос на новую идею продукта или сервиса?' },
      { key: 'q3' as const, text: 'Насколько вы уверены, что способны собрать и проанализировать информацию о трендах, чтобы обнаружить незакрытую потребность?' },
    ],
  },
  {
    number: 2,
    title: 'Планирование',
    questions: [
      { key: 'q4' as const, text: 'Насколько вы уверены, что сможете разработать реалистичную бизнес-модель для новой инициативы?' },
      { key: 'q5' as const, text: 'Насколько вы уверены, что сможете объяснить ценность своей идеи потенциальному клиенту так, чтобы он согласился заплатить авансом?' },
      { key: 'q6' as const, text: 'Насколько вы уверены, что сможете выделить ключевые риски проекта и предложить способы их управления?' },
    ],
  },
  {
    number: 3,
    title: 'Мобилизация ресурсов',
    questions: [
      { key: 'q7' as const, text: 'Насколько вы уверены, что сможете привлечь нужных людей в команду — сооснователей, экспертов, сотрудников?' },
      { key: 'q8' as const, text: 'Насколько вы уверены, что сможете запустить новое направление с минимальным бюджетом, без внешних инвестиций?' },
      { key: 'q9' as const, text: 'Насколько вы уверены, что сможете выстроить сеть партнёров и менторов, полезных для развития проекта?' },
    ],
  },
  {
    number: 4,
    title: 'Реализация — люди',
    questions: [
      { key: 'q10' as const, text: 'Насколько вы уверены, что сможете ставить чёткие цели команде и добиваться их исполнения в срок?' },
      { key: 'q11' as const, text: 'Насколько вы уверены, что способны мотивировать команду продолжать работу несмотря на неопределённость и неудачи?' },
      { key: 'q12' as const, text: 'Насколько вы уверены, что сможете конструктивно решать конфликты и поддерживать рабочую атмосферу в команде?' },
    ],
  },
  {
    number: 5,
    title: 'Реализация — финансы и рынок',
    questions: [
      { key: 'q13' as const, text: 'Насколько вы уверены, что сможете спланировать и контролировать бюджет проекта — доходы, расходы, денежный поток?' },
      { key: 'q14' as const, text: 'Насколько вы уверены, что сможете запустить и адаптировать стратегию маркетинга и продаж для вывода продукта на рынок?' },
      { key: 'q15' as const, text: 'Насколько вы уверены, что сможете оперативно менять ценовую политику и структуру затрат в ответ на изменения рынка?' },
    ],
  },
]

// ── Component ─────────────────────────────────────────────────

export default function ESEPage() {
  const router = useRouter()
  const [phase, setPhase] = useState(0)
  const [answers, setAnswers] = useState<ESEAnswers>(EMPTY)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ESE_STORAGE_KEY)
      if (saved) setAnswers(JSON.parse(saved))
    } catch {}
  }, [])

  const updateAnswer = (key: keyof ESEAnswers, value: number) => {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    try { localStorage.setItem(ESE_STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  const currentPhase = PHASES[phase]
  const isLast = phase === PHASES.length - 1
  const isFirst = phase === 0

  const handleNext = () => {
    if (isLast) {
      router.push('/assessment/overview')
    } else {
      setPhase(p => p + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (isFirst) {
      router.push('/assessment')
    } else {
      setPhase(p => p - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div style={{ maxWidth: '680px' }}>

      {/* Back */}
      <Link href="/assessment" style={{
        fontSize: '14px', color: '#9B8A7A', textDecoration: 'none',
        display: 'inline-block', marginBottom: '32px',
      }}>
        ← Диагностика
      </Link>

      {/* Progress */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em' }}>
            БЛОК 2 ИЗ 6 · ESE
          </span>
          <span style={{ fontSize: '12px', color: '#9B8A7A' }}>
            Фаза {phase + 1} из {PHASES.length}
          </span>
        </div>
        <div style={{ height: '3px', borderRadius: '2px', backgroundColor: 'rgba(244,237,227,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${((phase + 1) / PHASES.length) * 100}%`,
            backgroundColor: '#B57A56',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Scale legend — shown only on first phase */}
      {phase === 0 && (
        <div style={{
          backgroundColor: '#1A1613', borderRadius: '16px', padding: '16px 20px',
          border: '1px solid rgba(244,237,227,0.07)', marginBottom: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '13px', color: '#9B8A7A' }}>Шкала оценки:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6B5D52' }}>1 — совсем не уверен</span>
            <span style={{ fontSize: '13px', color: '#6B5D52' }}>···</span>
            <span style={{ fontSize: '13px', color: '#CDBEAE' }}>7 — полностью уверен</span>
          </div>
        </div>
      )}

      {/* Phase header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: 'rgba(181,122,86,0.18)',
            border: '1px solid rgba(181,122,86,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#D09062' }}>{currentPhase.number}</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F4EDE3' }}>{currentPhase.title}</h2>
        </div>
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '48px' }}>
        {currentPhase.questions.map((q, i) => (
          <ScaleQuestion
            key={q.key}
            number={(phase * 3) + i + 1}
            text={q.text}
            value={answers[q.key]}
            onChange={(v) => updateAnswer(q.key, v)}
          />
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <button onClick={handleBack} style={{
          backgroundColor: 'transparent', color: '#9B8A7A',
          border: '1px solid rgba(244,237,227,0.12)', borderRadius: '14px',
          padding: '12px 22px', fontSize: '14px', cursor: 'pointer',
        }}>
          ← Назад
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#6B5D52' }}>Сохраняется автоматически</span>
          <button onClick={handleNext} style={{
            backgroundColor: '#B57A56', color: '#F4EDE3', border: 'none',
            borderRadius: '14px', padding: '12px 24px', fontSize: '14px',
            fontWeight: 600, cursor: 'pointer',
          }}>
            {isLast ? 'Сохранить и к обзору →' : 'Далее →'}
          </button>
        </div>
      </div>

    </div>
  )
}

// ── Scale question component ──────────────────────────────────

function ScaleQuestion({
  number, text, value, onChange,
}: {
  number: number
  text: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div style={{
      backgroundColor: '#1A1613', borderRadius: '20px', padding: '20px 24px',
      border: '1px solid rgba(244,237,227,0.08)',
    }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '20px' }}>
        <span style={{
          fontSize: '11px', fontWeight: 600, color: '#B57A56',
          backgroundColor: 'rgba(181,122,86,0.12)',
          padding: '3px 9px', borderRadius: '9px', flexShrink: 0, marginTop: '2px',
        }}>
          {number}
        </span>
        <span style={{ fontSize: '15px', color: '#F4EDE3', lineHeight: 1.55 }}>{text}</span>
      </div>

      <div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => {
            const selected = value === n
            return (
              <button
                key={n}
                onClick={() => onChange(n)}
                style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  border: selected ? '1px solid rgba(181,122,86,0.7)' : '1px solid rgba(244,237,227,0.10)',
                  backgroundColor: selected ? 'rgba(181,122,86,0.22)' : 'rgba(244,237,227,0.03)',
                  color: selected ? '#D09062' : '#9B8A7A',
                  fontSize: '15px', fontWeight: selected ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.12s ease', flexShrink: 0,
                }}
              >
                {n}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ fontSize: '11px', color: '#6B5D52' }}>не уверен</span>
          <span style={{ fontSize: '11px', color: '#6B5D52' }}>полностью уверен</span>
        </div>
      </div>
    </div>
  )
}
