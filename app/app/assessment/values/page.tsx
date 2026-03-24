'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VALUES_STORAGE_KEY, type ValuesAnswers } from '@/lib/assessment'

const EMPTY: ValuesAnswers = {
  q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0,
  q7: 0, q8: 0, q9: 0, q10: 0, q11: 0, q12: 0,
  q13: 0, q14: 0, q15: 0, q16: 0, q17: 0, q18: 0,
}

const ALL_QUESTIONS: { key: keyof ValuesAnswers; text: string; reversed?: boolean; cluster: string }[] = [
  // Cluster 1: Достижения и власть
  { key: 'q1', cluster: 'Достижения и власть', text: 'Для него важно строить дело, которым можно гордиться, добиваться заметных результатов и признания.' },
  { key: 'q2', cluster: 'Достижения и власть', text: 'Он хочет зарабатывать достаточно, чтобы чувствовать независимость и иметь влияние на решения вокруг.' },
  { key: 'q3', cluster: 'Достижения и власть', text: 'Ему нравится брать на себя ответственность и принимать ключевые решения, а не подстраиваться под других.' },
  // Cluster 2: Открытость к изменениям, самостоятельность
  { key: 'q4', cluster: 'Открытость, самостоятельность', text: 'Ему важно иметь свободу самому решать, чем заниматься и как строить своё время.' },
  { key: 'q5', cluster: 'Открытость, самостоятельность', text: 'Он любит пробовать новое и не боится менять направление, если видит более интересную возможность.' },
  { key: 'q6', cluster: 'Открытость, самостоятельность', text: 'Он ценит возможность самому выбирать партнёров, клиентов и форматы работы, а не следовать заданным правилам.' },
  // Cluster 3: Забота о других, универсализм
  { key: 'q7', cluster: 'Забота о других, универсализм', text: 'Для него важно, чтобы его бизнес приносил пользу людям, а не только деньги.' },
  { key: 'q8', cluster: 'Забота о других, универсализм', text: 'Он старается относиться справедливо к клиентам, партнёрам и команде, даже если это не всегда максимально выгодно.' },
  { key: 'q9', cluster: 'Забота о других, универсализм', text: 'Ему не всё равно, как его решения влияют на город, природу и сообщество вокруг.' },
  // Cluster 4: Отношение к конкуренции и серым зонам
  { key: 'q10', cluster: 'Этика и правила', text: 'Для него важно соблюдать законы, правила и договорённости, даже если это усложняет работу.' },
  { key: 'q11', cluster: 'Этика и правила', text: 'Он предпочитает работать в белой зоне рынка, а не искать лазейки в серых схемах.' },
  { key: 'q12', cluster: 'Этика и правила', reversed: true, text: 'Если конкурент работает в серой зоне и выигрывает рынок — он готов пересмотреть свои границы допустимого.' },
  // Cluster 5: Безопасность
  { key: 'q13', cluster: 'Безопасность', text: 'Для него важно иметь финансовую подушку и не рисковать всем сразу ради одной идеи.' },
  { key: 'q14', cluster: 'Безопасность', text: 'Он предпочитает заранее продумывать, как защитить бизнес от форс-мажоров и кризисов.' },
  { key: 'q15', cluster: 'Безопасность', reversed: true, text: 'Он готов вложить значительную часть своих накоплений в новое дело, если верит в идею.' },
  // Cluster 6: Удовольствие и гедонизм
  { key: 'q16', cluster: 'Удовольствие и гедонизм', text: 'Для него важно получать удовольствие от повседневной работы, а не только от результата.' },
  { key: 'q17', cluster: 'Удовольствие и гедонизм', text: 'Он хочет, чтобы бизнес давал не только деньги, но и возможность жить интересной, насыщенной жизнью.' },
  { key: 'q18', cluster: 'Удовольствие и гедонизм', text: 'Он считает нормальным позволять себе отдых и личные радости, даже когда в бизнесе много задач.' },
]

const TOTAL = ALL_QUESTIONS.length // 18

export default function ValuesPage() {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<ValuesAnswers>(EMPTY)
  const [showError, setShowError] = useState(false)

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

  const q = ALL_QUESTIONS[idx]
  const isLast = idx === TOTAL - 1

  const handleNext = () => {
    if (answers[q.key] === 0) { setShowError(true); return }
    setShowError(false)
    if (isLast) router.push('/assessment/overview')
    else { setIdx(i => i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  const handleBack = () => {
    setShowError(false)
    if (idx === 0) router.push('/assessment')
    else { setIdx(i => i - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  const handleSelect = (key: keyof ValuesAnswers, value: number) => {
    updateAnswer(key, value)
    setShowError(false)
    if (!isLast) {
      setTimeout(() => { setIdx(i => i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }, 220)
    }
  }

  const prevCluster = idx > 0 ? ALL_QUESTIONS[idx - 1].cluster : null
  const isNewCluster = !prevCluster || prevCluster !== q.cluster

  return (
    <div style={{ maxWidth: '680px' }}>

      <Link href="/assessment" style={{
        fontSize: '14px', color: '#9B8A7A', textDecoration: 'none',
        display: 'inline-block', marginBottom: '32px',
      }}>
        ← Диагностика
      </Link>

      {/* Progress */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', color: '#9B8A7A', letterSpacing: '0.06em' }}>
            БЛОК 4 ИЗ 6 · ЦЕННОСТИ
          </span>
          <span style={{ fontSize: '12px', color: '#9B8A7A' }}>
            {idx + 1} из {TOTAL}
          </span>
        </div>
        <div style={{ height: '3px', borderRadius: '2px', backgroundColor: 'rgba(244,237,227,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${((idx + 1) / TOTAL) * 100}%`,
            backgroundColor: '#B57A56', borderRadius: '2px', transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Cluster label */}
      {isNewCluster ? (
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          backgroundColor: 'rgba(181,122,86,0.10)', borderRadius: '10px',
          padding: '5px 12px', marginBottom: '24px',
        }}>
          <span style={{ fontSize: '12px', color: '#D09062', fontWeight: 600, letterSpacing: '0.04em' }}>
            {q.cluster}
          </span>
        </div>
      ) : (
        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '12px', color: '#6B5D52', letterSpacing: '0.04em' }}>{q.cluster}</span>
        </div>
      )}

      {/* Scale legend */}
      <div style={{
        backgroundColor: '#1A1613', borderRadius: '14px', padding: '12px 16px',
        border: '1px solid rgba(244,237,227,0.07)', marginBottom: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '12px', color: '#9B8A7A' }}>Насколько описание похоже на вас:</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#6B5D52' }}>1 — совсем не похож</span>
          <span style={{ fontSize: '12px', color: '#6B5D52' }}>···</span>
          <span style={{ fontSize: '12px', color: '#CDBEAE' }}>6 — очень похож</span>
        </div>
      </div>

      {/* Single question */}
      <div style={{
        backgroundColor: '#1A1613', borderRadius: '20px', padding: '24px',
        border: showError ? '1px solid rgba(217,119,6,0.55)' : '1px solid rgba(244,237,227,0.08)',
        marginBottom: '32px', transition: 'border-color 0.15s ease',
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '24px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 600, color: '#B57A56',
            backgroundColor: 'rgba(181,122,86,0.12)',
            padding: '3px 9px', borderRadius: '9px', flexShrink: 0, marginTop: '2px',
          }}>
            {idx + 1}
          </span>
          <span style={{ fontSize: '16px', color: '#F4EDE3', lineHeight: 1.6, fontStyle: 'italic' }}>{q.text}</span>
        </div>

        <div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5, 6].map((n) => {
              const selected = answers[q.key] === n
              return (
                <button
                  key={n}
                  onClick={() => handleSelect(q.key, n)}
                  style={{
                    width: '46px', height: '46px', borderRadius: '13px',
                    border: selected ? '1px solid rgba(181,122,86,0.7)' : '1px solid rgba(244,237,227,0.12)',
                    backgroundColor: selected ? 'rgba(181,122,86,0.25)' : 'rgba(244,237,227,0.04)',
                    color: selected ? '#D09062' : '#9B8A7A',
                    fontSize: '16px', fontWeight: selected ? 700 : 400,
                    cursor: 'pointer', transition: 'all 0.12s ease', flexShrink: 0,
                  }}
                >
                  {n}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: '#6B5D52' }}>совсем не похож</span>
            <span style={{ fontSize: '11px', color: '#6B5D52' }}>очень похож</span>
          </div>
        </div>
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
