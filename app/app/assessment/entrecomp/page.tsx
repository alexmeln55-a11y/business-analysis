'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ENTRECOMP_STORAGE_KEY, type EntreCompAnswers } from '@/lib/assessment'

const EMPTY: EntreCompAnswers = {
  q1: 0, q2: 0, q3: 0,
  q4: 0, q5: 0, q6: 0,
  q7: 0, q8: 0, q9: 0,
}

const SECTIONS = [
  {
    number: 1,
    title: 'Идеация — поиск возможностей',
    description: 'Способность замечать рыночные пробелы и формулировать идеи под конкретный запрос.',
    questions: [
      { key: 'q1' as const, text: 'Я замечаю рыночные пробелы там, где другие видят только проблемы.' },
      { key: 'q2' as const, text: 'Мне легко придумывать идеи для новых продуктов и услуг — это естественный режим моего мышления.' },
      { key: 'q3' as const, text: 'Я регулярно думаю о том, как сделать что-то лучше или дешевле для конкретного клиента.' },
    ],
  },
  {
    number: 2,
    title: 'Действие в условиях неопределённости',
    description: 'Готовность запускаться без идеальных условий и быстро адаптироваться к изменениям.',
    questions: [
      { key: 'q4' as const, text: 'Я начинаю действовать с тем что есть — не жду идеальных условий или полного плана.' },
      { key: 'q5' as const, text: 'Я умею быстро переключаться между задачами, когда ситуация меняется неожиданно.' },
      { key: 'q6' as const, text: 'Я принимаю решения при неполной информации и не жду, пока картина станет полной.' },
    ],
  },
  {
    number: 3,
    title: 'Этическое измерение',
    description: 'Учёт последствий бизнес-решений и удержание ценностных границ в работе.',
    questions: [
      { key: 'q7' as const, text: 'Я думаю о том, как мои бизнес-решения влияют на клиентов, партнёров и общество.' },
      { key: 'q8' as const, text: 'Для меня важно, что мой продукт реально помогает людям, а не просто продаётся.' },
      { key: 'q9' as const, text: 'Я готов отказаться от выгодной сделки, если она противоречит моим принципам работы.' },
    ],
  },
]

export default function EntreCompPage() {
  const router = useRouter()
  const [section, setSection] = useState(0)
  const [answers, setAnswers] = useState<EntreCompAnswers>(EMPTY)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ENTRECOMP_STORAGE_KEY)
      if (saved) setAnswers(JSON.parse(saved))
    } catch {}
  }, [])

  const updateAnswer = (key: keyof EntreCompAnswers, value: number) => {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    try { localStorage.setItem(ENTRECOMP_STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  const current = SECTIONS[section]
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
            БЛОК 6 ИЗ 6 · КОМПЕТЕНЦИИ — ENTRECOMP
          </span>
          <span style={{ fontSize: '12px', color: '#9B8A7A' }}>
            Секция {section + 1} из {SECTIONS.length}
          </span>
        </div>
        <div style={{ height: '3px', borderRadius: '2px', backgroundColor: 'rgba(244,237,227,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${((section + 1) / SECTIONS.length) * 100}%`,
            backgroundColor: '#B57A56',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Scale legend — shown only on first section */}
      {section === 0 && (
        <div style={{
          backgroundColor: '#1A1613', borderRadius: '16px', padding: '16px 20px',
          border: '1px solid rgba(244,237,227,0.07)', marginBottom: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '13px', color: '#9B8A7A' }}>Насколько высказывание про вас:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6B5D52' }}>1 — совсем не про меня</span>
            <span style={{ fontSize: '13px', color: '#6B5D52' }}>···</span>
            <span style={{ fontSize: '13px', color: '#CDBEAE' }}>5 — очень точно про меня</span>
          </div>
        </div>
      )}

      {/* Section header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: 'rgba(181,122,86,0.18)',
            border: '1px solid rgba(181,122,86,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: '2px',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#D09062' }}>{current.number}</span>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F4EDE3', marginBottom: '6px' }}>
              {current.title}
            </h2>
            <p style={{ fontSize: '14px', color: '#9B8A7A', lineHeight: 1.55 }}>{current.description}</p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '48px' }}>
        {current.questions.map((q, i) => (
          <Scale5Question
            key={q.key}
            number={(section * 3) + i + 1}
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
            {isLast ? 'Завершить диагностику →' : 'Далее →'}
          </button>
        </div>
      </div>

    </div>
  )
}

function Scale5Question({
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
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = value === n
            return (
              <button
                key={n}
                onClick={() => onChange(n)}
                style={{
                  width: '44px', height: '44px', borderRadius: '12px',
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
          <span style={{ fontSize: '11px', color: '#6B5D52' }}>совсем не про меня</span>
          <span style={{ fontSize: '11px', color: '#6B5D52' }}>очень точно про меня</span>
        </div>
      </div>
    </div>
  )
}
