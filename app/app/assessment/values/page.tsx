'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VALUES_STORAGE_KEY, type ValuesAnswers } from '@/lib/assessment'

const EMPTY: ValuesAnswers = {
  q1: 0, q2: 0, q3: 0,
  q4: 0, q5: 0, q6: 0,
  q7: 0, q8: 0, q9: 0,
  q10: 0, q11: 0, q12: 0,
  q13: 0, q14: 0, q15: 0,
  q16: 0, q17: 0, q18: 0,
}

const CLUSTERS = [
  {
    number: 1,
    title: 'Достижения и власть',
    questions: [
      { key: 'q1' as const, text: 'Для него важно строить дело, которым можно гордиться, добиваться заметных результатов и признания.' },
      { key: 'q2' as const, text: 'Он хочет зарабатывать достаточно, чтобы чувствовать независимость и иметь влияние на решения вокруг.' },
      { key: 'q3' as const, text: 'Ему нравится брать на себя ответственность и принимать ключевые решения, а не подстраиваться под других.' },
    ],
  },
  {
    number: 2,
    title: 'Открытость к изменениям, самостоятельность',
    questions: [
      { key: 'q4' as const, text: 'Ему важно иметь свободу самому решать, чем заниматься и как строить своё время.' },
      { key: 'q5' as const, text: 'Он любит пробовать новое и не боится менять направление, если видит более интересную возможность.' },
      { key: 'q6' as const, text: 'Он ценит возможность самому выбирать партнёров, клиентов и форматы работы, а не следовать заданным правилам.' },
    ],
  },
  {
    number: 3,
    title: 'Забота о других, универсализм',
    questions: [
      { key: 'q7' as const, text: 'Для него важно, чтобы его бизнес приносил пользу людям, а не только деньги.' },
      { key: 'q8' as const, text: 'Он старается относиться справедливо к клиентам, партнёрам и команде, даже если это не всегда максимально выгодно.' },
      { key: 'q9' as const, text: 'Ему не всё равно, как его решения влияют на город, природу и сообщество вокруг.' },
    ],
  },
  {
    number: 4,
    title: 'Отношение к конкуренции и серым зонам',
    questions: [
      { key: 'q10' as const, text: 'Для него важно соблюдать законы, правила и договорённости, даже если это усложняет работу.' },
      { key: 'q11' as const, text: 'Он предпочитает работать в белой зоне рынка, а не искать лазейки в серых схемах.' },
      { key: 'q12' as const, text: 'Если конкурент работает в серой зоне и выигрывает рынок — он готов пересмотреть свои границы допустимого.', reversed: true },
    ],
  },
  {
    number: 5,
    title: 'Безопасность',
    questions: [
      { key: 'q13' as const, text: 'Для него важно иметь финансовую подушку и не рисковать всем сразу ради одной идеи.' },
      { key: 'q14' as const, text: 'Он предпочитает заранее продумывать, как защитить бизнес от форс-мажоров и кризисов.' },
      { key: 'q15' as const, text: 'Он готов вложить значительную часть своих накоплений в новое дело, если верит в идею.', reversed: true },
    ],
  },
  {
    number: 6,
    title: 'Удовольствие и гедонизм',
    questions: [
      { key: 'q16' as const, text: 'Для него важно получать удовольствие от повседневной работы, а не только от результата.' },
      { key: 'q17' as const, text: 'Он хочет, чтобы бизнес давал не только деньги, но и возможность жить интересной, насыщенной жизнью.' },
      { key: 'q18' as const, text: 'Он считает нормальным позволять себе отдых и личные радости, даже когда в бизнесе много задач.' },
    ],
  },
]

export default function ValuesPage() {
  const router = useRouter()
  const [cluster, setCluster] = useState(0)
  const [answers, setAnswers] = useState<ValuesAnswers>(EMPTY)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VALUES_STORAGE_KEY)
      if (saved) setAnswers(JSON.parse(saved))
    } catch {}
  }, [])

  const updateAnswer = (key: keyof ValuesAnswers, value: number) => {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    try { localStorage.setItem(VALUES_STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  const current = CLUSTERS[cluster]
  const isLast = cluster === CLUSTERS.length - 1
  const isFirst = cluster === 0

  const handleNext = () => {
    if (isLast) {
      router.push('/assessment/overview')
    } else {
      setCluster(c => c + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (isFirst) {
      router.push('/assessment')
    } else {
      setCluster(c => c - 1)
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
            БЛОК 4 ИЗ 6 · ЦЕННОСТИ
          </span>
          <span style={{ fontSize: '12px', color: '#9B8A7A' }}>
            Кластер {cluster + 1} из {CLUSTERS.length}
          </span>
        </div>
        <div style={{ height: '3px', borderRadius: '2px', backgroundColor: 'rgba(244,237,227,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${((cluster + 1) / CLUSTERS.length) * 100}%`,
            backgroundColor: '#B57A56',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Scale legend — shown only on first cluster */}
      {cluster === 0 && (
        <div style={{
          backgroundColor: '#1A1613', borderRadius: '16px', padding: '16px 20px',
          border: '1px solid rgba(244,237,227,0.07)', marginBottom: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '13px', color: '#9B8A7A' }}>Насколько описание похоже на вас:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6B5D52' }}>1 — совсем не похож</span>
            <span style={{ fontSize: '13px', color: '#6B5D52' }}>···</span>
            <span style={{ fontSize: '13px', color: '#CDBEAE' }}>6 — очень похож</span>
          </div>
        </div>
      )}

      {/* Cluster header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: 'rgba(181,122,86,0.18)',
            border: '1px solid rgba(181,122,86,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#D09062' }}>{current.number}</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F4EDE3' }}>{current.title}</h2>
        </div>
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '48px' }}>
        {current.questions.map((q, i) => (
          <Scale6Question
            key={q.key}
            number={(cluster * 3) + i + 1}
            text={q.text}
            reversed={'reversed' in q && q.reversed === true}
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

function Scale6Question({
  number, text, reversed, value, onChange,
}: {
  number: number
  text: string
  reversed: boolean
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
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '15px', color: '#F4EDE3', lineHeight: 1.55 }}>{text}</span>
          {reversed && (
            <span style={{
              display: 'inline-block', marginLeft: '8px',
              fontSize: '11px', color: '#6B5D52', letterSpacing: '0.04em',
            }}>
              ↺ обратная
            </span>
          )}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6].map((n) => {
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
          <span style={{ fontSize: '11px', color: '#6B5D52' }}>совсем не похож</span>
          <span style={{ fontSize: '11px', color: '#6B5D52' }}>очень похож</span>
        </div>
      </div>
    </div>
  )
}
