'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { INTAKE_STORAGE_KEY, type FounderIntakeAnswers } from '@/lib/assessment'

const EMPTY: FounderIntakeAnswers = {
  q1: '', q2: '', q3: '', q4: '',
  q5: '', q6: '', q7: '', q8: '',
  q9: '', q10: '', q11: '', q12: '',
  q13: '', q14: '', q15: '', q16: '',
}

// ── Sections ──────────────────────────────────────────────────

const SECTIONS = [
  {
    number: 1,
    title: 'Навыки руками',
    questions: [
      { key: 'q1' as const, text: 'Что вы умеете делать лично, за что люди уже платили вам деньги?' },
      { key: 'q2' as const, text: 'В чём вы разбираетесь лучше большинства людей в вашем окружении?' },
      { key: 'q3' as const, text: 'Какую задачу вы можете решить быстрее и качественнее, чем нанятый специалист?' },
      { key: 'q4' as const, text: 'Что вы делали в бизнесе сами и никогда не отдавали другим?' },
    ],
  },
  {
    number: 2,
    title: 'Связи и рынки',
    questions: [
      { key: 'q5' as const, text: 'В каких отраслях у вас есть реальные рабочие контакты — поставщики, клиенты, партнёры?' },
      { key: 'q6' as const, text: 'Кто в вашем окружении может купить у вас что-то новое в первые 30 дней?' },
      { key: 'q7' as const, text: 'В каких профессиональных сообществах вы участвуете или вас знают?' },
      { key: 'q8' as const, text: 'Есть ли у вас доступ к аудитории — подписчики, база клиентов, телеграм-канал?' },
    ],
  },
  {
    number: 3,
    title: 'Почему текущий бизнес не устраивает',
    questions: [
      { key: 'q9' as const, text: 'Что конкретно не устраивает в текущем бизнесе — деньги, смысл, рынок, команда?' },
      { key: 'q10' as const, text: 'Что изменилось в вашей отрасли за последние 2 года, что ударило по бизнесу?' },
      { key: 'q11' as const, text: 'Что вы пробовали изменить и не получилось?' },
      { key: 'q12' as const, text: 'Если бы завтра текущий бизнес исчез — что бы вы почувствовали?' },
    ],
  },
  {
    number: 4,
    title: 'Ресурсы для старта',
    questions: [
      { key: 'q13' as const, text: 'Сколько времени в неделю вы готовы тратить на новое направление прямо сейчас?' },
      { key: 'q14' as const, text: 'Какой бюджет готовы вложить в тест новой ниши без критичного риска?' },
      { key: 'q15' as const, text: 'Есть ли у вас люди, которые могут помочь на старте — бесплатно или за долю?' },
      { key: 'q16' as const, text: 'Сколько месяцев вы готовы работать без прибыли от нового направления?' },
    ],
  },
]

// ── Component ─────────────────────────────────────────────────

export default function FounderIntakePage() {
  const router = useRouter()
  const [section, setSection] = useState(0) // 0-indexed
  const [answers, setAnswers] = useState<FounderIntakeAnswers>(EMPTY)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(INTAKE_STORAGE_KEY)
      if (saved) setAnswers(JSON.parse(saved))
    } catch {}
  }, [])

  // Autosave on every change
  const updateAnswer = (key: keyof FounderIntakeAnswers, value: string) => {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    try { localStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  const currentSection = SECTIONS[section]
  const isLast = section === SECTIONS.length - 1
  const isFirst = section === 0

  const handleNext = () => {
    if (isLast) {
      router.push('/assessment/overview')
    } else {
      setSection(s => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (isFirst) {
      router.push('/assessment')
    } else {
      setSection(s => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div style={{ maxWidth: '680px' }}>

      {/* Back */}
      <Link href="/assessment" style={{
        fontSize: '14px',
        color: '#9B8A7A',
        textDecoration: 'none',
        display: 'inline-block',
        marginBottom: '32px',
      }}>
        ← Диагностика
      </Link>

      {/* Progress */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em' }}>
            БЛОК 1 ИЗ 6 · ОПЫТ, СВЯЗИ И РЕСУРСЫ
          </span>
          <span style={{ fontSize: '12px', color: '#9B8A7A' }}>
            Секция {section + 1} из {SECTIONS.length}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{
          height: '3px',
          borderRadius: '2px',
          backgroundColor: 'rgba(244,237,227,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${((section + 1) / SECTIONS.length) * 100}%`,
            backgroundColor: '#B57A56',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Section header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'rgba(181,122,86,0.18)',
            border: '1px solid rgba(181,122,86,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#D09062' }}>
              {currentSection.number}
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F4EDE3' }}>
            {currentSection.title}
          </h2>
        </div>
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '48px' }}>
        {currentSection.questions.map((q, i) => (
          <QuestionCard
            key={q.key}
            number={(section * 4) + i + 1}
            text={q.text}
            value={answers[q.key]}
            onChange={(v) => updateAnswer(q.key, v)}
          />
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <button onClick={handleBack} style={{
          backgroundColor: 'transparent',
          color: '#9B8A7A',
          border: '1px solid rgba(244,237,227,0.12)',
          borderRadius: '14px',
          padding: '12px 22px',
          fontSize: '14px',
          cursor: 'pointer',
        }}>
          ← Назад
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#6B5D52' }}>Сохраняется автоматически</span>
          <button onClick={handleNext} style={{
            backgroundColor: '#B57A56',
            color: '#F4EDE3',
            border: 'none',
            borderRadius: '14px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            {isLast ? 'Сохранить и продолжить →' : 'Далее →'}
          </button>
        </div>
      </div>

    </div>
  )
}

function QuestionCard({
  number, text, value, onChange,
}: {
  number: number
  text: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{
      backgroundColor: '#1A1613',
      borderRadius: '20px',
      padding: '20px 24px',
      border: '1px solid rgba(244,237,227,0.08)',
    }}>
      <label style={{ display: 'block', cursor: 'text' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '14px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#B57A56',
            backgroundColor: 'rgba(181,122,86,0.12)',
            padding: '3px 9px',
            borderRadius: '9px',
            flexShrink: 0,
            marginTop: '2px',
          }}>
            {number}
          </span>
          <span style={{ fontSize: '15px', color: '#F4EDE3', lineHeight: 1.55 }}>{text}</span>
        </div>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          placeholder="Ваш ответ…"
          style={{
            width: '100%',
            backgroundColor: 'rgba(244,237,227,0.04)',
            border: '1px solid rgba(244,237,227,0.10)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            color: '#F4EDE3',
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </label>
    </div>
  )
}
