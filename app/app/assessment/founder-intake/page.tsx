'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BLOCK1_AI_STORAGE_KEY,
  AI_TAG_LABELS,
  type Block1AIAnswers,
  type IntakeQuestionAnswer,
  type ClarificationMessage,
} from '@/lib/assessment'

// ── Question definitions ───────────────────────────────────────

const QUESTIONS = [
  {
    id: 'q1',
    section: 'Навыки и монетизация',
    text: 'За что вам платили деньги за последние 3 года? Опишите своими словами — что конкретно вы делали.',
    placeholder: 'Например: продавал строительные материалы b2b, вёл переговоры с подрядчиками, управлял командой из 10 человек...',
  },
  {
    id: 'q2',
    section: 'Навыки и монетизация',
    text: 'В чём вы реально лучше большинства людей вокруг вас? Назовите одну-две вещи, где вы явно сильнее.',
    placeholder: 'Например: умею убеждать холодных клиентов, строю процессы с нуля, глубоко разбираюсь в финансах...',
  },
  {
    id: 'q3',
    section: 'Рыночный доступ',
    text: 'С какими типами клиентов или рынков вы уже работали? Есть ли у вас контакты, которым можно было бы предложить что-то новое?',
    placeholder: 'Например: строительные подрядчики в Москве, знаю 30+ директоров производств, есть база клиентов из прошлого бизнеса...',
  },
  {
    id: 'q4',
    section: 'Рыночный доступ',
    text: 'Через какой канал вы могли бы найти первых покупателей прямо сейчас?',
    placeholder: 'Например: через личные знакомства, через Telegram-канал, через бывших клиентов, через рекомендации...',
  },
  {
    id: 'q5',
    section: 'Контекст и мотивация',
    text: 'Почему вы сейчас ищете новую бизнес-возможность? Что не устраивает в текущей ситуации?',
    placeholder: 'Например: хочу уйти из найма, текущий бизнес не растёт, нужен дополнительный доход, хочу больше свободы...',
  },
  {
    id: 'q6',
    section: 'Контекст и мотивация',
    text: 'Что вы уже пробовали запускать или менять? Что сработало или не сработало?',
    placeholder: 'Например: пробовал агентство — не пошло, нет продаж. Консалтинг работал, но устал от разовых заказов...',
  },
  {
    id: 'q7',
    section: 'Ресурсы и ограничения',
    text: 'Сколько времени в неделю вы готовы вкладывать в новое направление? Как быстро вам нужен результат в деньгах?',
    placeholder: 'Например: 20 часов в неделю, деньги нужны через 2–3 месяца. Или: могу ждать год, есть подушка...',
  },
  {
    id: 'q8',
    section: 'Ресурсы и ограничения',
    text: 'Какой бюджет вы готовы вложить в запуск? Есть ли помощники, партнёры или команда?',
    placeholder: 'Например: до 300 тысяч рублей, работаю один. Или: есть партнёр-технарь, бюджет до 1 млн...',
  },
]

// ── State types ────────────────────────────────────────────────

type QuestionPhase =
  | 'idle'
  | 'loading'
  | 'clarifying'
  | 'clarifying_loading'
  | 'resolved'
  | 'error'

// ── Main component ─────────────────────────────────────────────

export default function FounderIntakePage() {
  const router = useRouter()

  // Persisted answers for all questions
  const [answers, setAnswers] = useState<Block1AIAnswers>({})

  // Which question we're on (0-indexed)
  const [currentIdx, setCurrentIdx] = useState(0)

  // Per-question state
  const [phase, setPhase] = useState<QuestionPhase>('idle')
  const [mainInput, setMainInput] = useState('')
  const [clarificationInput, setClarificationInput] = useState('')
  const [clarifyingQuestion, setClarifyingQuestion] = useState('')
  const [clarificationHistory, setClarificationHistory] = useState<ClarificationMessage[]>([])
  const [rawAnswer, setRawAnswer] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const clarifyRef = useRef<HTMLTextAreaElement>(null)

  // Load saved answers from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BLOCK1_AI_STORAGE_KEY)
      if (saved) {
        const parsed: Block1AIAnswers = JSON.parse(saved)
        setAnswers(parsed)
        // Find first unanswered question
        const firstUnanswered = QUESTIONS.findIndex(q => {
          const a = parsed[q.id]
          return !a || (a.status !== 'resolved' && a.status !== 'low_confidence' && a.status !== 'skipped')
        })
        if (firstUnanswered === -1) {
          // All done
          router.push('/assessment')
          return
        }
        setCurrentIdx(firstUnanswered)
      }
    } catch {}
  }, [router])

  // Focus textarea when question changes
  useEffect(() => {
    if (phase === 'idle') {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
    if (phase === 'clarifying') {
      setTimeout(() => clarifyRef.current?.focus(), 100)
    }
  }, [currentIdx, phase])

  const currentQ = QUESTIONS[currentIdx]
  const totalQ = QUESTIONS.length
  const progress = Math.round(((Object.values(answers).filter(
    a => a.status === 'resolved' || a.status === 'low_confidence' || a.status === 'skipped'
  ).length) / totalQ) * 100)

  // Save answer and advance
  function saveAnswer(answer: IntakeQuestionAnswer) {
    const updated = { ...answers, [answer.questionId]: answer }
    setAnswers(updated)
    try {
      localStorage.setItem(BLOCK1_AI_STORAGE_KEY, JSON.stringify(updated))
    } catch {}
    return updated
  }

  // Move to next question or finish
  function advance(updatedAnswers: Block1AIAnswers) {
    const nextIdx = currentIdx + 1
    if (nextIdx >= totalQ) {
      // All done — navigate to assessment
      router.push('/assessment')
      return
    }
    // Check if next question already answered
    const nextQ = QUESTIONS[nextIdx]
    const nextAnswer = updatedAnswers[nextQ.id]
    if (nextAnswer && (nextAnswer.status === 'resolved' || nextAnswer.status === 'low_confidence' || nextAnswer.status === 'skipped')) {
      // Find next unanswered
      const nextUnanswered = QUESTIONS.findIndex((q, i) => {
        if (i <= nextIdx) return false
        const a = updatedAnswers[q.id]
        return !a || (a.status !== 'resolved' && a.status !== 'low_confidence' && a.status !== 'skipped')
      })
      if (nextUnanswered === -1) {
        router.push('/assessment')
        return
      }
      setCurrentIdx(nextUnanswered)
    } else {
      setCurrentIdx(nextIdx)
    }
    setPhase('idle')
    setMainInput('')
    setClarificationInput('')
    setClarifyingQuestion('')
    setClarificationHistory([])
    setRawAnswer('')
    setErrorMsg('')
  }

  // Call /api/assessment/clarify
  async function callClarify(
    qId: string,
    qText: string,
    raw: string,
    history: ClarificationMessage[],
  ): Promise<{ done: boolean; clarifyingQuestion?: string; finalClarifiedAnswer?: string; finalTag?: string; confidence?: 'high' | 'medium' | 'low' }> {
    const res = await fetch('/api/assessment/clarify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: qId,
        questionText: qText,
        rawAnswer: raw,
        clarificationHistory: history,
      }),
    })
    if (!res.ok) throw new Error('api_error')
    return res.json()
  }

  // Handle main answer submission
  async function handleSubmitMain() {
    const input = mainInput.trim()
    if (!input && phase === 'idle') {
      // Allow skipping with empty input
      const skipped: IntakeQuestionAnswer = {
        questionId: currentQ.id,
        rawAnswer: '',
        clarificationHistory: [],
        finalClarifiedAnswer: '',
        finalTag: '',
        confidence: 'low',
        status: 'skipped',
      }
      const updated = saveAnswer(skipped)
      advance(updated)
      return
    }

    setPhase('loading')
    setErrorMsg('')
    setRawAnswer(input)

    try {
      const result = await callClarify(currentQ.id, currentQ.text, input, [])
      if (result.done) {
        const answer: IntakeQuestionAnswer = {
          questionId: currentQ.id,
          rawAnswer: input,
          clarificationHistory: [],
          finalClarifiedAnswer: result.finalClarifiedAnswer ?? input,
          finalTag: result.finalTag ?? '',
          confidence: result.confidence ?? 'low',
          status: result.confidence === 'low' ? 'low_confidence' : 'resolved',
        }
        const updated = saveAnswer(answer)
        setPhase('resolved')
        // Auto-advance after short delay
        setTimeout(() => advance(updated), 1400)
      } else {
        setClarifyingQuestion(result.clarifyingQuestion ?? 'Уточните, пожалуйста.')
        setClarificationHistory([{ role: 'ai', content: result.clarifyingQuestion ?? '' }])
        setPhase('clarifying')
      }
    } catch {
      setPhase('error')
      setErrorMsg('Не удалось получить ответ от AI. Попробуйте ещё раз.')
    }
  }

  // Handle clarification answer submission
  async function handleSubmitClarification() {
    const input = clarificationInput.trim()
    if (!input) return

    setPhase('clarifying_loading')
    setErrorMsg('')

    const newHistory: ClarificationMessage[] = [
      ...clarificationHistory,
      { role: 'user', content: input },
    ]

    try {
      const result = await callClarify(currentQ.id, currentQ.text, rawAnswer, newHistory)
      if (result.done) {
        const answer: IntakeQuestionAnswer = {
          questionId: currentQ.id,
          rawAnswer,
          clarificationHistory: newHistory,
          finalClarifiedAnswer: result.finalClarifiedAnswer ?? rawAnswer,
          finalTag: result.finalTag ?? '',
          confidence: result.confidence ?? 'low',
          status: result.confidence === 'low' ? 'low_confidence' : 'resolved',
        }
        const updated = saveAnswer(answer)
        setPhase('resolved')
        setTimeout(() => advance(updated), 1400)
      } else {
        // Second clarification round
        const updatedHistory: ClarificationMessage[] = [
          ...newHistory,
          { role: 'ai', content: result.clarifyingQuestion ?? '' },
        ]
        setClarifyingQuestion(result.clarifyingQuestion ?? 'Уточните, пожалуйста.')
        setClarificationHistory(updatedHistory)
        setClarificationInput('')
        setPhase('clarifying')
      }
    } catch {
      setPhase('error')
      setErrorMsg('Не удалось получить ответ от AI. Попробуйте ещё раз.')
    }
  }

  // Retry after error
  function handleRetry() {
    setPhase('idle')
    setErrorMsg('')
  }

  // Skip current question
  function handleSkip() {
    const skipped: IntakeQuestionAnswer = {
      questionId: currentQ.id,
      rawAnswer: mainInput.trim(),
      clarificationHistory: [],
      finalClarifiedAnswer: '',
      finalTag: '',
      confidence: 'low',
      status: 'skipped',
    }
    const updated = saveAnswer(skipped)
    advance(updated)
  }

  const isLoading = phase === 'loading' || phase === 'clarifying_loading'
  const answeredCount = Object.values(answers).filter(
    a => a.status === 'resolved' || a.status === 'low_confidence' || a.status === 'skipped'
  ).length

  // ── Render ─────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '640px' }}>

      {/* Back */}
      <Link href="/assessment" style={{
        fontSize: '13px', color: '#9B8A7A', textDecoration: 'none',
        display: 'inline-block', marginBottom: '32px',
      }}>
        ← Диагностика
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.08em', marginBottom: '8px', textTransform: 'uppercase' }}>
          Блок 1 — Распаковка основателя
        </div>
        <h1 style={{ fontSize: '22px', color: '#F2EBE1', fontWeight: 500, margin: 0 }}>
          Расскажите своими словами
        </h1>
        <p style={{ fontSize: '14px', color: '#9B8A7A', margin: '8px 0 0' }}>
          AI уточнит смысл, если нужно — и зафиксирует ваш профиль
        </p>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#9B8A7A' }}>
            {currentQ.section}
          </span>
          <span style={{ fontSize: '12px', color: '#9B8A7A' }}>
            {answeredCount} / {totalQ}
          </span>
        </div>
        <div style={{ height: '2px', background: '#2A2018', borderRadius: '1px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: '#C17F3E',
            borderRadius: '1px',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Question card */}
      <div style={{
        background: '#1A1510',
        border: '1px solid #2A2018',
        borderRadius: '12px',
        padding: '32px',
      }}>

        {/* Question number + text */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: '#C17F3E', letterSpacing: '0.08em', marginBottom: '12px' }}>
            ВОПРОС {currentIdx + 1}
          </div>
          <p style={{ fontSize: '17px', color: '#F2EBE1', margin: 0, lineHeight: 1.5 }}>
            {currentQ.text}
          </p>
        </div>

        {/* Main input (shown in idle / clarifying / error states) */}
        {(phase === 'idle' || phase === 'loading' || (phase === 'error' && !clarifyingQuestion)) && (
          <div style={{ marginBottom: '16px' }}>
            <textarea
              ref={textareaRef}
              value={mainInput}
              onChange={e => setMainInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  if (!isLoading) handleSubmitMain()
                }
              }}
              placeholder={currentQ.placeholder}
              disabled={isLoading}
              rows={4}
              style={{
                width: '100%',
                background: '#0F0D0A',
                border: '1px solid #2A2018',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '15px',
                color: '#F2EBE1',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                boxSizing: 'border-box',
                opacity: isLoading ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            />
            <div style={{ fontSize: '11px', color: '#5A4A3A', marginTop: '6px' }}>
              Cmd+Enter для отправки
            </div>
          </div>
        )}

        {/* Loading state */}
        {phase === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '12px 0' }}>
            <LoadingDots />
            <span style={{ fontSize: '13px', color: '#9B8A7A' }}>AI читает ваш ответ...</span>
          </div>
        )}

        {/* Clarifying question */}
        {(phase === 'clarifying' || phase === 'clarifying_loading') && (
          <div style={{ marginBottom: '20px' }}>
            {/* Show original answer summary */}
            <div style={{
              background: '#0F0D0A',
              border: '1px solid #2A2018',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '11px', color: '#5A4A3A', marginBottom: '4px' }}>Ваш ответ</div>
              <div style={{ fontSize: '14px', color: '#9B8A7A', lineHeight: 1.4 }}>{rawAnswer}</div>
            </div>

            {/* AI clarifying question */}
            <div style={{
              background: '#1E1A14',
              border: '1px solid #3A2E20',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '11px', color: '#C17F3E', marginBottom: '6px', letterSpacing: '0.06em' }}>
                AI уточняет
              </div>
              <div style={{ fontSize: '15px', color: '#F2EBE1', lineHeight: 1.5 }}>
                {clarifyingQuestion}
              </div>
            </div>

            {/* Clarification input */}
            <textarea
              ref={clarifyRef}
              value={clarificationInput}
              onChange={e => setClarificationInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  if (!isLoading) handleSubmitClarification()
                }
              }}
              placeholder="Ваш ответ на уточнение..."
              disabled={isLoading}
              rows={3}
              style={{
                width: '100%',
                background: '#0F0D0A',
                border: '1px solid #2A2018',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '15px',
                color: '#F2EBE1',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                boxSizing: 'border-box',
                opacity: isLoading ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            />
            {phase === 'clarifying_loading' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                <LoadingDots />
                <span style={{ fontSize: '13px', color: '#9B8A7A' }}>AI анализирует...</span>
              </div>
            )}
          </div>
        )}

        {/* Resolved state */}
        {phase === 'resolved' && (() => {
          const a = answers[currentQ.id]
          return (
            <div style={{
              background: '#0F150D',
              border: '1px solid #2A3820',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>✓</span>
              <div>
                <div style={{ fontSize: '13px', color: '#7AB87A', marginBottom: '4px' }}>
                  Ответ зафиксирован
                </div>
                {a && a.finalClarifiedAnswer && (
                  <div style={{ fontSize: '14px', color: '#9B8A7A', lineHeight: 1.4 }}>
                    {a.finalClarifiedAnswer}
                  </div>
                )}
                {a && a.finalTag && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      color: '#C17F3E',
                      background: '#2A1E10',
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}>
                      {AI_TAG_LABELS[a.finalTag] ?? a.finalTag}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* Error state */}
        {phase === 'error' && (
          <div style={{
            background: '#150D0D',
            border: '1px solid #3A2020',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '13px', color: '#C07070', marginBottom: '8px' }}>
              {errorMsg}
            </div>
            <button
              onClick={handleRetry}
              style={{
                background: 'transparent',
                border: '1px solid #3A2020',
                color: '#9B8A7A',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Action buttons */}
        {phase !== 'resolved' && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
            {/* Submit button */}
            {(phase === 'idle' || phase === 'loading' || phase === 'error') && (
              <button
                onClick={handleSubmitMain}
                disabled={isLoading}
                style={{
                  background: '#C17F3E',
                  color: '#0F0D0A',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {isLoading ? 'Обрабатываю...' : 'Продолжить'}
              </button>
            )}

            {/* Submit clarification */}
            {(phase === 'clarifying' || phase === 'clarifying_loading') && (
              <button
                onClick={handleSubmitClarification}
                disabled={isLoading || !clarificationInput.trim()}
                style={{
                  background: '#C17F3E',
                  color: '#0F0D0A',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: (isLoading || !clarificationInput.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isLoading || !clarificationInput.trim()) ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {isLoading ? 'Обрабатываю...' : 'Ответить'}
              </button>
            )}

            {/* Skip */}
            {!isLoading && phase !== 'clarifying' && (
              <button
                onClick={handleSkip}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#5A4A3A',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '12px 0',
                }}
              >
                Пропустить
              </button>
            )}
          </div>
        )}
      </div>

      {/* Answered questions summary (compact) */}
      {answeredCount > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ fontSize: '11px', color: '#5A4A3A', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Зафиксировано
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {QUESTIONS.map((q, i) => {
              const a = answers[q.id]
              if (!a || (a.status !== 'resolved' && a.status !== 'low_confidence' && a.status !== 'skipped')) return null
              return (
                <div key={q.id} style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  background: a.status === 'skipped' ? '#1A1510' : '#1A1510',
                  border: `1px solid ${a.status === 'skipped' ? '#2A2018' : '#3A2E20'}`,
                  color: a.status === 'skipped' ? '#5A4A3A' : '#9B8A7A',
                  cursor: 'pointer',
                }}
                  onClick={() => {
                    if (i === currentIdx) return
                    setCurrentIdx(i)
                    setPhase('idle')
                    setMainInput('')
                    setClarificationInput('')
                    setClarifyingQuestion('')
                    setClarificationHistory([])
                    setRawAnswer('')
                    setErrorMsg('')
                  }}
                  title={a.finalClarifiedAnswer || 'Пропущен'}
                >
                  В{i + 1} {a.finalTag && a.status !== 'skipped' ? `· ${AI_TAG_LABELS[a.finalTag] ?? a.finalTag}` : a.status === 'skipped' ? '· пропущен' : ''}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Loading dots component ─────────────────────────────────────

function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: '#C17F3E',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
