'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HEXACO_STORAGE_KEY, type HEXACOAnswers } from '@/lib/assessment'

const EMPTY: HEXACOAnswers = {
  q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0,
  q7: 0, q8: 0, q9: 0, q10: 0, q11: 0, q12: 0,
  q13: 0, q14: 0, q15: 0, q16: 0, q17: 0, q18: 0,
  q19: 0, q20: 0, q21: 0, q22: 0, q23: 0, q24: 0,
}

// All 24 questions flat, grouped by factor for display
const ALL_QUESTIONS: { key: keyof HEXACOAnswers; text: string; reversed?: boolean; factor: string }[] = [
  // Factor 1: Честность–Смиренность
  { key: 'q1', factor: 'Честность–Смиренность', text: 'В работе с клиентами для меня важнее сохранить репутацию, чем «выжать максимум» из каждой сделки.' },
  { key: 'q2', factor: 'Честность–Смиренность', text: 'Я готов отказаться от выгодного, но не совсем честного предложения, даже если никто об этом не узнает.' },
  { key: 'q3', factor: 'Честность–Смиренность', text: 'Я открыт к обратной связи и признаю свои ошибки перед партнёрами и командой.' },
  { key: 'q4', factor: 'Честность–Смиренность', text: 'Мне некомфортно завышать свои достижения или приукрашивать результаты ради выгоды.' },
  // Factor 2: Эмоциональность
  { key: 'q5', factor: 'Эмоциональность', text: 'Неудачи в проекте надолго выбивают меня из колеи.' },
  { key: 'q6', factor: 'Эмоциональность', text: 'В стрессовых ситуациях, связанных с деньгами или ответственностью, мне трудно сохранять спокойствие.' },
  { key: 'q7', factor: 'Эмоциональность', text: 'Перед важными решениями я часто переживаю так сильно, что это мешает действовать.' },
  { key: 'q8', factor: 'Эмоциональность', text: 'Когда бизнес идёт плохо несколько месяцев подряд, я продолжаю действовать без паники.', reversed: true },
  // Factor 3: Экстраверсия
  { key: 'q9', factor: 'Экстраверсия', text: 'Мне нравится быть «лицом» проекта — выступать, презентовать, общаться с новыми людьми.' },
  { key: 'q10', factor: 'Экстраверсия', text: 'Я легко завожу деловые знакомства на мероприятиях, в чатах и онлайн-сообществах.' },
  { key: 'q11', factor: 'Экстраверсия', text: 'Общение с клиентами и партнёрами скорее заряжает меня энергией, чем утомляет.' },
  { key: 'q12', factor: 'Экстраверсия', text: 'Я чувствую себя уверенно, когда нужно вести переговоры или публично отстаивать свою позицию.' },
  // Factor 4: Доброжелательность
  { key: 'q13', factor: 'Доброжелательность', text: 'В конфликтной ситуации я стараюсь сначала понять позицию другой стороны, а не сразу отстаивать своё.' },
  { key: 'q14', factor: 'Доброжелательность', text: 'Я готов идти на разумные уступки, если это помогает сохранить долгосрочные отношения.' },
  { key: 'q15', factor: 'Доброжелательность', text: 'Даже при жёстких переговорах я стараюсь оставаться корректным и уважительным.' },
  { key: 'q16', factor: 'Доброжелательность', text: 'Мне сложно отказать клиенту или партнёру, даже когда это невыгодно для меня.' },
  // Factor 5: Добросовестность
  { key: 'q17', factor: 'Добросовестность', text: 'Я обычно довожу начатые задачи до конца, даже если потерял к ним интерес.' },
  { key: 'q18', factor: 'Добросовестность', text: 'Я работаю по плану и умею организовать своё время так, чтобы успевать главное.' },
  { key: 'q19', factor: 'Добросовестность', text: 'Перед запуском нового шага я предпочитаю всё продумать, а не действовать «на авось».' },
  { key: 'q20', factor: 'Добросовестность', text: 'Я внимательно отношусь к деталям — договоры, цифры, сроки редко ускользают от моего внимания.' },
  // Factor 6: Открытость к опыту
  { key: 'q21', factor: 'Открытость к опыту', text: 'Мне интересно пробовать новые форматы, инструменты и подходы в своём деле, даже если нет гарантий результата.' },
  { key: 'q22', factor: 'Открытость к опыту', text: 'Я часто ищу идеи вне своей отрасли — в других бизнесах, науке, искусстве, технологиях.' },
  { key: 'q23', factor: 'Открытость к опыту', text: 'Я люблю переосмысливать устоявшиеся правила и искать нестандартные решения для задач.' },
  { key: 'q24', factor: 'Открытость к опыту', text: 'Изменения на рынке я воспринимаю скорее как возможность, чем как угрозу.' },
]

const TOTAL = ALL_QUESTIONS.length // 24

export default function HEXACOPage() {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<HEXACOAnswers>(EMPTY)
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HEXACO_STORAGE_KEY)
      if (saved) setAnswers(JSON.parse(saved))
    } catch {}
  }, [])

  const updateAnswer = (key: keyof HEXACOAnswers, value: number) => {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    try { localStorage.setItem(HEXACO_STORAGE_KEY, JSON.stringify(next)) } catch {}
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

  // Auto-advance when scale is selected
  const handleSelect = (key: keyof HEXACOAnswers, value: number) => {
    updateAnswer(key, value)
    setShowError(false)
    if (!isLast) {
      setTimeout(() => { setIdx(i => i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }, 220)
    }
  }

  // Find if factor changed from previous question
  const prevFactor = idx > 0 ? ALL_QUESTIONS[idx - 1].factor : null
  const isNewFactor = !prevFactor || prevFactor !== q.factor

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
            БЛОК 3 ИЗ 6 · HEXACO
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

      {/* Factor label */}
      {isNewFactor && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          backgroundColor: 'rgba(181,122,86,0.10)', borderRadius: '10px',
          padding: '5px 12px', marginBottom: '24px',
        }}>
          <span style={{ fontSize: '12px', color: '#D09062', fontWeight: 600, letterSpacing: '0.04em' }}>
            {q.factor}
          </span>
        </div>
      )}
      {!isNewFactor && (
        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '12px', color: '#6B5D52', letterSpacing: '0.04em' }}>{q.factor}</span>
        </div>
      )}

      {/* Scale legend */}
      <div style={{
        backgroundColor: '#1A1613', borderRadius: '14px', padding: '12px 16px',
        border: '1px solid rgba(244,237,227,0.07)', marginBottom: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '12px', color: '#9B8A7A' }}>Насколько высказывание про вас:</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#6B5D52' }}>1 — не согласен</span>
          <span style={{ fontSize: '12px', color: '#6B5D52' }}>···</span>
          <span style={{ fontSize: '12px', color: '#CDBEAE' }}>5 — согласен</span>
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
          <span style={{ fontSize: '16px', color: '#F4EDE3', lineHeight: 1.6 }}>{q.text}</span>
        </div>

        <div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const selected = answers[q.key] === n
              return (
                <button
                  key={n}
                  onClick={() => handleSelect(q.key, n)}
                  style={{
                    width: '52px', height: '52px', borderRadius: '14px',
                    border: selected ? '1px solid rgba(181,122,86,0.7)' : '1px solid rgba(244,237,227,0.12)',
                    backgroundColor: selected ? 'rgba(181,122,86,0.25)' : 'rgba(244,237,227,0.04)',
                    color: selected ? '#D09062' : '#9B8A7A',
                    fontSize: '17px', fontWeight: selected ? 700 : 400,
                    cursor: 'pointer', transition: 'all 0.12s ease', flexShrink: 0,
                  }}
                >
                  {n}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
            <span style={{ fontSize: '11px', color: '#6B5D52' }}>не согласен</span>
            <span style={{ fontSize: '11px', color: '#6B5D52' }}>согласен</span>
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
