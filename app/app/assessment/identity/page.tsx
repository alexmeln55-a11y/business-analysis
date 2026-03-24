'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IDENTITY_STORAGE_KEY, IDENTITY_SCENARIOS_STORAGE_KEY,
  type IdentityAnswers, type IdentityScenarios, type ScenarioChoice,
} from '@/lib/assessment'

// ── Scale questions (15 total, 3 sections of 5) ───────────────

const EMPTY_SCALE: IdentityAnswers = {
  q1: 0, q2: 0, q3: 0, q4: 0, q5: 0,
  q6: 0, q7: 0, q8: 0, q9: 0, q10: 0,
  q11: 0, q12: 0, q13: 0, q14: 0, q15: 0,
}

const EMPTY_SCENARIOS: IdentityScenarios = { s1: null, s2: null, s3: null }

const SECTIONS = [
  {
    number: 1,
    title: 'Darwinian — рыночная идентичность',
    description: 'Ориентация на рост, прибыль и конкуренцию как главные метрики успеха.',
    questions: [
      { key: 'q1' as const, text: 'Главный критерий успеха для меня — финансовый результат и рост доли рынка.' },
      { key: 'q2' as const, text: 'Если продукт не приносит прибыль — я меняю или закрываю его, даже если вложено много сил.' },
      { key: 'q3' as const, text: 'Я строю бизнес по чётким принципам — цифры и эффективность важнее отношений и эмоций.' },
      { key: 'q4' as const, text: 'Мне комфортно конкурировать жёстко — я воспринимаю рынок как соревнование, где есть победители и проигравшие.' },
      { key: 'q5' as const, text: 'Когда я думаю о своём бизнесе — первое что приходит в голову это цифры, а не люди или идеи.' },
    ],
  },
  {
    number: 2,
    title: 'Communitarian — идентичность сообщества',
    description: 'Ориентация на конкретную аудиторию, нишу и доверительные отношения.',
    questions: [
      { key: 'q6' as const, text: 'Я строю бизнес для конкретной группы людей — тех кого понимаю изнутри лучше чем любой внешний игрок.' },
      { key: 'q7' as const, text: 'Мне важно быть частью профессионального или отраслевого сообщества — не наблюдателем, а своим.' },
      { key: 'q8' as const, text: 'Я считаю себя успешным когда люди из моей аудитории говорят — это именно то что нам нужно.' },
      { key: 'q9' as const, text: 'Отношения с постоянными клиентами для меня важнее выхода на новые рынки и масштаба.' },
      { key: 'q10' as const, text: 'Я скорее углублюсь в одну нишу и стану в ней лучшим для своих, чем буду расти вширь для всех.' },
    ],
  },
  {
    number: 3,
    title: 'Missionary — миссионерская идентичность',
    description: 'Ориентация на идею, ценности и измеримое влияние на отрасль или людей.',
    questions: [
      { key: 'q11' as const, text: 'За моим бизнесом стоит конкретное убеждение — я могу сформулировать его одним предложением.' },
      { key: 'q12' as const, text: 'Когда бизнес противоречит моим ценностям — я меняю бизнес, а не ценности.' },
      { key: 'q13' as const, text: 'Я продолжаю дело даже при минимальной прибыли — пока вижу реальный результат для людей или отрасли.' },
      { key: 'q14' as const, text: 'Если бы мой бизнес зарабатывал столько же но не менял ничего вокруг — я бы не чувствовал себя успешным.' },
      { key: 'q15' as const, text: 'Моя оценка успеха — насколько продвинулась важная для меня идея, а не сколько я заработал.' },
    ],
  },
]

// ── Forced-choice scenarios ───────────────────────────────────

const SCENARIOS: {
  key: keyof IdentityScenarios
  title: string
  situation: string
  options: { choice: 'a' | 'b' | 'c' | 'd'; text: string }[]
}[] = [
  {
    key: 's1',
    title: 'Сценарий 1 из 3',
    situation: 'Конкурент скопировал ваш продукт и демпингует — его цена на 25% ниже вашей. Клиенты начинают уходить.',
    options: [
      { choice: 'a', text: 'Снижаю цену и вступаю в прямую ценовую войну — кто выживет, тот и прав' },
      { choice: 'b', text: 'Углубляюсь в свою нишу: усиливаю сервис, экспертизу и доверие — там конкурент не достанет' },
      { choice: 'c', text: 'Держусь своей позиции и объясняю, за что мы дороже — миссия важнее краткосрочных потерь' },
      { choice: 'd', text: 'Ищу новый сегмент, куда конкурент ещё не зашёл, и переключаюсь туда' },
    ],
  },
  {
    key: 's2',
    title: 'Сценарий 2 из 3',
    situation: 'Есть возможность быстро вырасти х3, но нужно выйти за пределы своей нишевой аудитории и размыть позиционирование.',
    options: [
      { choice: 'a', text: 'Иду на рост — нишевость была инструментом, не целью' },
      { choice: 'b', text: 'Остаюсь в нише — лучше быть лучшим для своих, чем средним для всех' },
      { choice: 'c', text: 'Расту только если это не противоречит тому, зачем я вообще строю этот бизнес' },
      { choice: 'd', text: 'Делаю отдельный продукт под новый сегмент, не трогая текущее' },
    ],
  },
  {
    key: 's3',
    title: 'Сценарий 3 из 3',
    situation: 'Крупный клиент предлагает выгодный контракт, но его требования противоречат идее, с которой вы строите бизнес.',
    options: [
      { choice: 'a', text: 'Берусь — деньги позволят продолжать делать то, во что верю' },
      { choice: 'b', text: 'Отказываюсь — бизнес теряет смысл, если делать то, во что не веришь' },
      { choice: 'c', text: 'Беру контракт, но держу его отдельно — это просто коммерческий проект' },
      { choice: 'd', text: 'Пробую договориться об условиях, которые не противоречат моим принципам' },
    ],
  },
]

const TOTAL_SECTIONS = SECTIONS.length + 1 // 3 scale + 1 scenario section

// ── Component ─────────────────────────────────────────────────

export default function IdentityPage() {
  const router = useRouter()
  const [section, setSection] = useState(0) // 0-2: scale sections, 3: scenarios
  const [answers, setAnswers] = useState<IdentityAnswers>(EMPTY_SCALE)
  const [scenarios, setScenarios] = useState<IdentityScenarios>(EMPTY_SCENARIOS)
  const [showErrors, setShowErrors] = useState(false)

  useEffect(() => {
    try {
      const s1 = localStorage.getItem(IDENTITY_STORAGE_KEY); if (s1) setAnswers(JSON.parse(s1))
      const s2 = localStorage.getItem(IDENTITY_SCENARIOS_STORAGE_KEY); if (s2) setScenarios(JSON.parse(s2))
    } catch {}
  }, [])

  const updateAnswer = (key: keyof IdentityAnswers, value: number) => {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    try { localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  const updateScenario = (key: keyof IdentityScenarios, value: ScenarioChoice) => {
    const next = { ...scenarios, [key]: value }
    setScenarios(next)
    try { localStorage.setItem(IDENTITY_SCENARIOS_STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  const isScenarioSection = section === 3
  const isLast = section === TOTAL_SECTIONS - 1

  const isSectionComplete = () => {
    if (isScenarioSection) {
      return SCENARIOS.every(s => scenarios[s.key] !== null)
    }
    const current = SECTIONS[section]
    return current.questions.every(q => answers[q.key] > 0)
  }

  const handleNext = () => {
    if (!isSectionComplete()) {
      setShowErrors(true)
      const el = document.querySelector('[data-identity-error]')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setShowErrors(false)
    if (isLast) router.push('/assessment/overview')
    else { setSection(s => s + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  const handleBack = () => {
    setShowErrors(false)
    if (section === 0) router.push('/assessment')
    else { setSection(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
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
            БЛОК 5 ИЗ 6 · ПРЕДПРИНИМАТЕЛЬСКАЯ ИДЕНТИЧНОСТЬ
          </span>
          <span style={{ fontSize: '12px', color: '#9B8A7A' }}>
            {section + 1} из {TOTAL_SECTIONS}
          </span>
        </div>
        <div style={{ height: '3px', borderRadius: '2px', backgroundColor: 'rgba(244,237,227,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${((section + 1) / TOTAL_SECTIONS) * 100}%`,
            backgroundColor: '#B57A56', borderRadius: '2px', transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Scale sections 0-2 */}
      {!isScenarioSection && (() => {
        const current = SECTIONS[section]
        return (
          <>
            {/* Scale legend */}
            <div style={{
              backgroundColor: '#1A1613', borderRadius: '16px', padding: '14px 18px',
              border: '1px solid rgba(244,237,227,0.07)', marginBottom: '28px',
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

            {/* Section header */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  backgroundColor: 'rgba(181,122,86,0.18)', border: '1px solid rgba(181,122,86,0.4)',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
              {current.questions.map((q, i) => (
                <Scale5Question
                  key={q.key}
                  number={(section * 5) + i + 1}
                  text={q.text}
                  value={answers[q.key]}
                  hasError={showErrors && answers[q.key] === 0}
                  onChange={(v) => updateAnswer(q.key, v)}
                />
              ))}
            </div>
          </>
        )
      })()}

      {/* Scenario section */}
      {isScenarioSection && (
        <>
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              backgroundColor: 'rgba(181,122,86,0.10)', borderRadius: '10px',
              padding: '5px 12px', marginBottom: '12px',
            }}>
              <span style={{ fontSize: '12px', color: '#D09062', fontWeight: 600, letterSpacing: '0.04em' }}>
                ПОВЕДЕНЧЕСКИЙ БЛОК
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F4EDE3', marginBottom: '8px' }}>
              Три сценария
            </h2>
            <p style={{ fontSize: '14px', color: '#9B8A7A', lineHeight: 1.55 }}>
              Выберите ответ, который ближе всего к тому, что вы бы сделали в реальности. Нет правильных или неправильных вариантов.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '48px' }}>
            {SCENARIOS.map(s => (
              <ScenarioCard
                key={s.key}
                title={s.title}
                situation={s.situation}
                options={s.options}
                selected={scenarios[s.key]}
                hasError={showErrors && scenarios[s.key] === null}
                onSelect={(v) => updateScenario(s.key, v)}
              />
            ))}
          </div>
        </>
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
            {isLast ? 'Сохранить и к обзору →' : 'Далее →'}
          </button>
        </div>
      </div>

    </div>
  )
}

// ── Scale5Question ────────────────────────────────────────────

function Scale5Question({
  number, text, value, hasError, onChange,
}: {
  number: number; text: string; value: number; hasError?: boolean; onChange: (v: number) => void
}) {
  return (
    <div
      data-identity-error={hasError ? 'true' : undefined}
      style={{
        backgroundColor: '#1A1613', borderRadius: '20px', padding: '20px 24px',
        border: hasError ? '1px solid rgba(217,119,6,0.55)' : '1px solid rgba(244,237,227,0.08)',
        transition: 'border-color 0.15s ease',
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
          <span style={{ fontSize: '11px', color: '#6B5D52' }}>совсем не про меня</span>
          <span style={{ fontSize: '11px', color: '#6B5D52' }}>очень точно про меня</span>
        </div>
      </div>
    </div>
  )
}

// ── ScenarioCard ──────────────────────────────────────────────

function ScenarioCard({
  title, situation, options, selected, hasError, onSelect,
}: {
  title: string
  situation: string
  options: { choice: 'a' | 'b' | 'c' | 'd'; text: string }[]
  selected: ScenarioChoice
  hasError?: boolean
  onSelect: (v: ScenarioChoice) => void
}) {
  return (
    <div
      data-identity-error={hasError ? 'true' : undefined}
      style={{
        backgroundColor: '#1A1613', borderRadius: '20px', padding: '20px 24px',
        border: hasError ? '1px solid rgba(217,119,6,0.55)' : '1px solid rgba(244,237,227,0.08)',
        transition: 'border-color 0.15s ease',
      }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: '#6B5D52', marginBottom: '8px', letterSpacing: '0.06em' }}>
          {title.toUpperCase()}
        </div>
        <p style={{ fontSize: '15px', color: '#CDBEAE', lineHeight: 1.6 }}>{situation}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {options.map(opt => {
          const on = selected === opt.choice
          return (
            <button
              key={opt.choice}
              onClick={() => onSelect(opt.choice)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '12px 16px', borderRadius: '14px', cursor: 'pointer',
                border: on ? '1px solid rgba(181,122,86,0.5)' : '1px solid rgba(244,237,227,0.08)',
                backgroundColor: on ? 'rgba(181,122,86,0.12)' : 'rgba(244,237,227,0.02)',
                textAlign: 'left', width: '100%',
              }}
            >
              <span style={{
                width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
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
