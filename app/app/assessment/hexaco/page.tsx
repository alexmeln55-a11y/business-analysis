'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HEXACO_STORAGE_KEY, type HEXACOAnswers } from '@/lib/assessment'

const EMPTY: HEXACOAnswers = {
  q1: 0, q2: 0, q3: 0, q4: 0,
  q5: 0, q6: 0, q7: 0, q8: 0,
  q9: 0, q10: 0, q11: 0, q12: 0,
  q13: 0, q14: 0, q15: 0, q16: 0,
  q17: 0, q18: 0, q19: 0, q20: 0,
  q21: 0, q22: 0, q23: 0, q24: 0,
}

const FACTORS = [
  {
    number: 1,
    title: 'Честность–Смиренность',
    questions: [
      { key: 'q1' as const, text: 'В работе с клиентами для меня важнее сохранить репутацию, чем «выжать максимум» из каждой сделки.' },
      { key: 'q2' as const, text: 'Я готов отказаться от выгодного, но не совсем честного предложения, даже если никто об этом не узнает.' },
      { key: 'q3' as const, text: 'Я открыт к обратной связи и признаю свои ошибки перед партнёрами и командой.' },
      { key: 'q4' as const, text: 'Мне некомфортно завышать свои достижения или приукрашивать результаты ради выгоды.' },
    ],
  },
  {
    number: 2,
    title: 'Эмоциональность',
    questions: [
      { key: 'q5' as const, text: 'Неудачи в проекте надолго выбивают меня из колеи.' },
      { key: 'q6' as const, text: 'В стрессовых ситуациях, связанных с деньгами или ответственностью, мне трудно сохранять спокойствие.' },
      { key: 'q7' as const, text: 'Перед важными решениями я часто переживаю так сильно, что это мешает действовать.' },
      { key: 'q8' as const, text: 'Когда бизнес идёт плохо несколько месяцев подряд, я продолжаю действовать без паники.', reversed: true },
    ],
  },
  {
    number: 3,
    title: 'Экстраверсия',
    questions: [
      { key: 'q9' as const, text: 'Мне нравится быть «лицом» проекта — выступать, презентовать, общаться с новыми людьми.' },
      { key: 'q10' as const, text: 'Я легко завожу деловые знакомства на мероприятиях, в чатах и онлайн-сообществах.' },
      { key: 'q11' as const, text: 'Общение с клиентами и партнёрами скорее заряжает меня энергией, чем утомляет.' },
      { key: 'q12' as const, text: 'Я чувствую себя уверенно, когда нужно вести переговоры или публично отстаивать свою позицию.' },
    ],
  },
  {
    number: 4,
    title: 'Доброжелательность',
    questions: [
      { key: 'q13' as const, text: 'В конфликтной ситуации я стараюсь сначала понять позицию другой стороны, а не сразу отстаивать своё.' },
      { key: 'q14' as const, text: 'Я готов идти на разумные уступки, если это помогает сохранить долгосрочные отношения.' },
      { key: 'q15' as const, text: 'Даже при жёстких переговорах я стараюсь оставаться корректным и уважительным.' },
      { key: 'q16' as const, text: 'Мне сложно отказать клиенту или партнёру, даже когда это невыгодно для меня.' },
    ],
  },
  {
    number: 5,
    title: 'Добросовестность',
    questions: [
      { key: 'q17' as const, text: 'Я обычно довожу начатые задачи до конца, даже если потерял к ним интерес.' },
      { key: 'q18' as const, text: 'Я работаю по плану и умею организовать своё время так, чтобы успевать главное.' },
      { key: 'q19' as const, text: 'Перед запуском нового шага я предпочитаю всё продумать, а не действовать «на авось».' },
      { key: 'q20' as const, text: 'Я внимательно отношусь к деталям — договоры, цифры, сроки редко ускользают от моего внимания.' },
    ],
  },
  {
    number: 6,
    title: 'Открытость к опыту',
    questions: [
      { key: 'q21' as const, text: 'Мне интересно пробовать новые форматы, инструменты и подходы в своём деле, даже если нет гарантий результата.' },
      { key: 'q22' as const, text: 'Я часто ищу идеи вне своей отрасли — в других бизнесах, науке, искусстве, технологиях.' },
      { key: 'q23' as const, text: 'Я люблю переосмысливать устоявшиеся правила и искать нестандартные решения для задач.' },
      { key: 'q24' as const, text: 'Изменения на рынке я воспринимаю скорее как возможность, чем как угрозу.' },
    ],
  },
]

export default function HEXACOPage() {
  const router = useRouter()
  const [factor, setFactor] = useState(0)
  const [answers, setAnswers] = useState<HEXACOAnswers>(EMPTY)

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

  const currentFactor = FACTORS[factor]
  const isLast = factor === FACTORS.length - 1
  const isFirst = factor === 0

  const handleNext = () => {
    if (isLast) {
      router.push('/assessment/overview')
    } else {
      setFactor(f => f + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (isFirst) {
      router.push('/assessment')
    } else {
      setFactor(f => f - 1)
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
            БЛОК 3 ИЗ 6 · HEXACO
          </span>
          <span style={{ fontSize: '12px', color: '#9B8A7A' }}>
            Фактор {factor + 1} из {FACTORS.length}
          </span>
        </div>
        <div style={{ height: '3px', borderRadius: '2px', backgroundColor: 'rgba(244,237,227,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${((factor + 1) / FACTORS.length) * 100}%`,
            backgroundColor: '#B57A56',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Scale legend — shown only on first factor */}
      {factor === 0 && (
        <div style={{
          backgroundColor: '#1A1613', borderRadius: '16px', padding: '16px 20px',
          border: '1px solid rgba(244,237,227,0.07)', marginBottom: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '13px', color: '#9B8A7A' }}>Шкала оценки:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6B5D52' }}>1 — совсем не согласен</span>
            <span style={{ fontSize: '13px', color: '#6B5D52' }}>···</span>
            <span style={{ fontSize: '13px', color: '#CDBEAE' }}>5 — полностью согласен</span>
          </div>
        </div>
      )}

      {/* Factor header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: 'rgba(181,122,86,0.18)',
            border: '1px solid rgba(181,122,86,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#D09062' }}>{currentFactor.number}</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F4EDE3' }}>{currentFactor.title}</h2>
        </div>
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '48px' }}>
        {currentFactor.questions.map((q, i) => (
          <Scale5Question
            key={q.key}
            number={(factor * 4) + i + 1}
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

function Scale5Question({
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
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = value === n
            return (
              <button
                key={n}
                onClick={() => onChange(n)}
                style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  border: selected ? '1px solid rgba(181,122,86,0.7)' : '1px solid rgba(244,237,227,0.10)',
                  backgroundColor: selected ? 'rgba(181,122,86,0.22)' : 'rgba(244,237,227,0.03)',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ fontSize: '11px', color: '#6B5D52' }}>не согласен</span>
          <span style={{ fontSize: '11px', color: '#6B5D52' }}>согласен</span>
        </div>
      </div>
    </div>
  )
}
