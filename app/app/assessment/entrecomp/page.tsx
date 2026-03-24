'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ENTRECOMP_V2_STORAGE_KEY, type EntreCompV2Answers, type ScenarioChoice } from '@/lib/assessment'

// ── Data ──────────────────────────────────────────────────────

const EMPTY: EntreCompV2Answers = {
  s1: null, s2: null, s3: null,
  e1: null, e2: null, e3: null, e4: null,
}

// Scenarios
const SCENARIOS = [
  {
    key: 's1' as const,
    competency: 'Идеация и возможности',
    title: 'Нестандартная проблема',
    situation: 'В разговоре с клиентом вы замечаете проблему, которую он сам не формулировал — но она явно мешает ему работать. Ничего готового на рынке нет.',
    options: [
      { choice: 'a' as const, text: 'Начинаю разбираться прямо сейчас — звоню ещё двум-трём клиентам проверить, общая ли это проблема' },
      { choice: 'b' as const, text: 'Фиксирую в блокноте и двигаюсь дальше — может, когда-нибудь вернусь к этому' },
      { choice: 'c' as const, text: 'Не мой фокус — лучше сосредоточиться на том, что уже работает' },
      { choice: 'd' as const, text: 'Спрашиваю клиента, что ему нужно, и жду запроса от рынка' },
    ],
  },
  {
    key: 's2' as const,
    competency: 'Действие в неопределённости',
    title: 'Рынок резко меняется',
    situation: 'Ключевой канал продаж перестал работать. Данных мало, картина неполная. Команда ждёт решения.',
    options: [
      { choice: 'a' as const, text: 'Запускаю тест нового канала прямо сейчас — с тем, что есть, не жду полной информации' },
      { choice: 'b' as const, text: 'Жду, пока ситуация прояснится — действовать без данных слишком рискованно' },
      { choice: 'c' as const, text: 'Привлекаю партнёра или консультанта, чтобы разделить риск и ответственность' },
      { choice: 'd' as const, text: 'Анализирую риски по каждому варианту и принимаю решение через 2–3 дня' },
    ],
  },
  {
    key: 's3' as const,
    competency: 'Этическое измерение',
    title: 'Выгодная сделка против принципов',
    situation: 'Потенциальный клиент готов платить хорошие деньги, но условия сделки противоречат тому, как вы строите свой бизнес.',
    options: [
      { choice: 'a' as const, text: 'Отказываюсь — нельзя строить репутацию на сделках, в которые не веришь' },
      { choice: 'b' as const, text: 'Берусь, но договариваюсь об изменении условий — ищу компромисс' },
      { choice: 'c' as const, text: 'Берусь — деньги важнее, принципы можно гибко трактовать' },
      { choice: 'd' as const, text: 'Советуюсь с командой или партнёром — не хочу решать в одиночку' },
    ],
  },
]

// Evidence questions
const EVIDENCE_QUESTIONS = [
  {
    key: 'e1' as const,
    competency: 'Действие в неопределённости',
    text: 'Вы запускали новое направление или продукт, когда ещё не было полной уверенности в результате?',
    options: [
      { value: 'yes' as const, label: 'Да, запускал' },
      { value: 'partial' as const, label: 'Было, но очень осторожно' },
      { value: 'no' as const, label: 'Нет, всегда ждал подтверждения' },
    ],
  },
  {
    key: 'e2' as const,
    competency: 'Идеация и возможности',
    text: 'После первых отказов рынка — меняли ли вы продукт / предложение под реальный запрос?',
    options: [
      { value: 'yes' as const, label: 'Да, менял существенно' },
      { value: 'partial' as const, label: 'Слегка корректировал' },
      { value: 'no' as const, label: 'Держался изначального плана' },
    ],
  },
  {
    key: 'e3' as const,
    competency: 'Этическое измерение',
    text: 'Отказывались ли вы от выгодной сделки из-за принципов?',
    options: [
      { value: 'yes' as const, label: 'Да, отказывался' },
      { value: 'no' as const, label: 'Нет, таких ситуаций не было или не отказывался' },
    ],
  },
  {
    key: 'e4' as const,
    competency: 'Идеация и возможности',
    text: 'Сколько новых идей вы тестировали за последние 2 года?',
    options: [
      { value: '5+' as const, label: '5 и более' },
      { value: '3-5' as const, label: '3–5 идей' },
      { value: '1-2' as const, label: '1–2 идеи' },
      { value: '0' as const, label: 'Ни одной' },
    ],
  },
]

// Screens: 3 scenario screens + 1 evidence screen = 4 total
const TOTAL = 4

// ── Component ─────────────────────────────────────────────────

export default function EntreCompPage() {
  const router = useRouter()
  const [screen, setScreen] = useState(0)
  const [answers, setAnswers] = useState<EntreCompV2Answers>(EMPTY)
  const [showErrors, setShowErrors] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ENTRECOMP_V2_STORAGE_KEY)
      if (saved) setAnswers(JSON.parse(saved))
    } catch {}
  }, [])

  const save = (next: EntreCompV2Answers) => {
    setAnswers(next)
    try { localStorage.setItem(ENTRECOMP_V2_STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  const updateScenario = (key: 's1' | 's2' | 's3', value: ScenarioChoice) => {
    save({ ...answers, [key]: value })
  }

  const updateEvidence = <K extends 'e1' | 'e2' | 'e3' | 'e4'>(
    key: K,
    value: EntreCompV2Answers[K],
  ) => {
    save({ ...answers, [key]: value })
  }

  const isLast = screen === TOTAL - 1
  const isEvidenceScreen = screen === 3

  const isScreenComplete = () => {
    if (isEvidenceScreen) {
      return answers.e1 !== null && answers.e2 !== null && answers.e3 !== null && answers.e4 !== null
    }
    const key = SCENARIOS[screen].key
    return answers[key] !== null
  }

  const handleNext = () => {
    if (!isScreenComplete()) {
      setShowErrors(true)
      const el = document.querySelector('[data-entrecomp-error]')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setShowErrors(false)
    if (isLast) router.push('/assessment/overview')
    else { setScreen(s => s + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  const handleBack = () => {
    setShowErrors(false)
    if (screen === 0) router.push('/assessment')
    else { setScreen(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  const currentScenario = !isEvidenceScreen ? SCENARIOS[screen] : null

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
            {screen + 1} из {TOTAL}
          </span>
        </div>
        <div style={{ height: '3px', borderRadius: '2px', backgroundColor: 'rgba(244,237,227,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${((screen + 1) / TOTAL) * 100}%`,
            backgroundColor: '#B57A56', borderRadius: '2px', transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Scenario screens */}
      {currentScenario && (
        <ScenarioScreen
          scenario={currentScenario}
          selected={answers[currentScenario.key]}
          hasError={showErrors && answers[currentScenario.key] === null}
          onSelect={(v) => { updateScenario(currentScenario.key, v); setShowErrors(false) }}
        />
      )}

      {/* Evidence screen */}
      {isEvidenceScreen && (
        <EvidenceScreen
          answers={answers}
          showErrors={showErrors}
          onUpdate={updateEvidence}
        />
      )}

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

// ── Scenario screen ───────────────────────────────────────────

function ScenarioScreen({
  scenario, selected, hasError, onSelect,
}: {
  scenario: typeof SCENARIOS[0]
  selected: ScenarioChoice
  hasError?: boolean
  onSelect: (v: ScenarioChoice) => void
}) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          backgroundColor: 'rgba(181,122,86,0.10)', borderRadius: '10px',
          padding: '4px 11px', marginBottom: '12px',
        }}>
          <span style={{ fontSize: '11px', color: '#D09062', fontWeight: 600, letterSpacing: '0.04em' }}>
            {scenario.competency.toUpperCase()}
          </span>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F4EDE3', marginBottom: '14px' }}>
          {scenario.title}
        </h2>
        <div style={{
          backgroundColor: '#1F1B18', borderRadius: '14px', padding: '16px 20px',
          border: '1px solid rgba(244,237,227,0.08)',
        }}>
          <p style={{ fontSize: '15px', color: '#CDBEAE', lineHeight: 1.65, margin: 0 }}>
            {scenario.situation}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', color: '#6B5D52' }}>Какой вариант ближе всего к тому, что бы вы сделали?</span>
      </div>

      <div
        data-entrecomp-error={hasError ? 'true' : undefined}
        style={{
          display: 'flex', flexDirection: 'column', gap: '8px',
          borderRadius: '16px',
          outline: hasError ? '1px solid rgba(217,119,6,0.45)' : 'none',
          padding: hasError ? '8px' : '0',
          transition: 'outline 0.15s ease',
        }}>
        {scenario.options.map(opt => {
          const on = selected === opt.choice
          return (
            <button
              key={opt.choice}
              onClick={() => onSelect(opt.choice)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                border: on ? '1px solid rgba(181,122,86,0.5)' : '1px solid rgba(244,237,227,0.08)',
                backgroundColor: on ? 'rgba(181,122,86,0.12)' : 'rgba(244,237,227,0.02)',
                textAlign: 'left', width: '100%',
              }}
            >
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                border: on ? '1px solid rgba(181,122,86,0.6)' : '1px solid rgba(244,237,227,0.15)',
                backgroundColor: on ? 'rgba(181,122,86,0.22)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700,
                color: on ? '#D09062' : '#6B5D52',
                marginTop: '1px',
              }}>
                {opt.choice.toUpperCase()}
              </span>
              <span style={{ fontSize: '14px', color: on ? '#F4EDE3' : '#9B8A7A', lineHeight: 1.55 }}>
                {opt.text}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Evidence screen ───────────────────────────────────────────

function EvidenceScreen({
  answers,
  showErrors,
  onUpdate,
}: {
  answers: EntreCompV2Answers
  showErrors?: boolean
  onUpdate: <K extends 'e1' | 'e2' | 'e3' | 'e4'>(key: K, value: EntreCompV2Answers[K]) => void
}) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          backgroundColor: 'rgba(181,122,86,0.10)', borderRadius: '10px',
          padding: '4px 11px', marginBottom: '12px',
        }}>
          <span style={{ fontSize: '11px', color: '#D09062', fontWeight: 600, letterSpacing: '0.04em' }}>
            ПОВЕДЕНЧЕСКИЕ ФАКТЫ
          </span>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F4EDE3', marginBottom: '8px' }}>
          Что уже было в вашем опыте
        </h2>
        <p style={{ fontSize: '14px', color: '#9B8A7A', lineHeight: 1.55 }}>
          Отвечайте честно — это не тест на правильность, это сбор фактов.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {EVIDENCE_QUESTIONS.map(q => (
          <EvidenceQuestion
            key={q.key}
            text={q.text}
            competency={q.competency}
            options={q.options}
            selected={answers[q.key]}
            hasError={showErrors && answers[q.key] === null}
            onSelect={(v) => {
              if (q.key === 'e3') {
                onUpdate(q.key, v as EntreCompV2Answers['e3'])
              } else if (q.key === 'e4') {
                onUpdate(q.key, v as EntreCompV2Answers['e4'])
              } else {
                onUpdate(q.key as 'e1' | 'e2', v as EntreCompV2Answers['e1'])
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}

function EvidenceQuestion({
  text, competency, options, selected, hasError, onSelect,
}: {
  text: string
  competency: string
  options: { value: string; label: string }[]
  selected: string | null
  hasError?: boolean
  onSelect: (v: string) => void
}) {
  return (
    <div
      data-entrecomp-error={hasError ? 'true' : undefined}
      style={{
        backgroundColor: '#1A1613', borderRadius: '18px', padding: '18px 20px',
        border: hasError ? '1px solid rgba(217,119,6,0.55)' : '1px solid rgba(244,237,227,0.08)',
        transition: 'border-color 0.15s ease',
      }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', color: '#6B5D52', marginBottom: '6px', letterSpacing: '0.04em' }}>
          {competency.toUpperCase()}
        </div>
        <p style={{ fontSize: '15px', color: '#F4EDE3', lineHeight: 1.55, margin: 0 }}>{text}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {options.map(opt => {
          const on = selected === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '11px', cursor: 'pointer',
                border: on ? '1px solid rgba(181,122,86,0.5)' : '1px solid rgba(244,237,227,0.08)',
                backgroundColor: on ? 'rgba(181,122,86,0.12)' : 'rgba(244,237,227,0.02)',
                textAlign: 'left', width: '100%',
              }}
            >
              <div style={{
                width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
                border: on ? '1px solid rgba(181,122,86,0.7)' : '1px solid rgba(244,237,227,0.20)',
                backgroundColor: on ? '#B57A56' : 'transparent',
              }} />
              <span style={{ fontSize: '14px', color: on ? '#F4EDE3' : '#9B8A7A' }}>{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
