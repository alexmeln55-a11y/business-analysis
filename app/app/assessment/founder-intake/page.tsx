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

// ── Question definitions (4 секции × 4 вопроса = 16) ──────────

const QUESTIONS = [
  // ── Секция 1: Навыки и монетизация ──
  {
    id: 'q1',
    section: 'Навыки и монетизация',
    text: 'За что вам платили деньги за последние 3 года? Опишите своими словами — что конкретно вы делали.',
    placeholder: '',
  },
  {
    id: 'q2',
    section: 'Навыки и монетизация',
    text: 'В чём вы реально лучше большинства людей вокруг вас? Назовите одну-две вещи, где вы явно сильнее.',
    placeholder: '',
  },
  {
    id: 'q3',
    section: 'Навыки и монетизация',
    text: 'Какие навыки у вас уже оплачены рынком — клиенты или работодатели платили именно за это?',
    placeholder: '',
  },
  {
    id: 'q4',
    section: 'Навыки и монетизация',
    text: 'Что вы умеете делать настолько хорошо, что вас рекомендуют или зовут повторно?',
    placeholder: '',
  },

  // ── Секция 2: Рыночный доступ ──
  {
    id: 'q5',
    section: 'Рыночный доступ',
    text: 'С какими типами клиентов или отраслями вы уже работали? Есть ли контакты, которым можно предложить что-то новое?',
    placeholder: '',
  },
  {
    id: 'q6',
    section: 'Рыночный доступ',
    text: 'Через какой канал вы могли бы найти первых покупателей прямо сейчас?',
    placeholder: '',
  },
  {
    id: 'q7',
    section: 'Рыночный доступ',
    text: 'Есть ли у вас партнёры, поставщики, подрядчики или аудитория, с которой уже есть контакт?',
    placeholder: '',
  },
  {
    id: 'q8',
    section: 'Рыночный доступ',
    text: 'Кому именно вы могли бы продать что-то новое уже в первые 30 дней — конкретно, не абстрактно?',
    placeholder: '',
  },

  // ── Секция 3: Контекст и мотивация ──
  {
    id: 'q9',
    section: 'Контекст и мотивация',
    text: 'Почему вы сейчас ищете новую бизнес-возможность? Что не устраивает в текущей ситуации?',
    placeholder: '',
  },
  {
    id: 'q10',
    section: 'Контекст и мотивация',
    text: 'Что вы уже пробовали запускать или менять? Что сработало, а что нет?',
    placeholder: '',
  },
  {
    id: 'q11',
    section: 'Контекст и мотивация',
    text: 'Что останавливало вас раньше от запуска нового направления?',
    placeholder: '',
  },
  {
    id: 'q12',
    section: 'Контекст и мотивация',
    text: 'Чем вы хотите заниматься — и чем точно не хотите? Что для вас неприемлемо?',
    placeholder: '',
  },

  // ── Секция 4: Ресурсы и ограничения ──
  {
    id: 'q13',
    section: 'Ресурсы и ограничения',
    text: 'Сколько времени в неделю вы готовы вкладывать в новое направление?',
    placeholder: '',
  },
  {
    id: 'q14',
    section: 'Ресурсы и ограничения',
    text: 'Как быстро вам нужен результат в деньгах? Сколько месяцев без прибыли вы можете выдержать?',
    placeholder: '',
  },
  {
    id: 'q15',
    section: 'Ресурсы и ограничения',
    text: 'Какой бюджет вы готовы вложить в запуск?',
    placeholder: '',
  },
  {
    id: 'q16',
    section: 'Ресурсы и ограничения',
    text: 'Есть ли у вас помощники, партнёры или команда? Готовы работать в одиночку?',
    placeholder: '',
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

  const [answers, setAnswers] = useState<Block1AIAnswers>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [allDone, setAllDone] = useState(false)

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
        const firstUnanswered = QUESTIONS.findIndex(q => {
          const a = parsed[q.id]
          return !a || (a.status !== 'resolved' && a.status !== 'low_confidence' && a.status !== 'skipped')
        })
        if (firstUnanswered === -1) {
          // All answered — show review state instead of redirecting
          setAllDone(true)
          setCurrentIdx(QUESTIONS.length - 1)
        } else {
          setCurrentIdx(firstUnanswered)
        }
      }
    } catch {}
  }, [])

  // Focus textarea when question changes
  useEffect(() => {
    if (phase === 'idle') setTimeout(() => textareaRef.current?.focus(), 100)
    if (phase === 'clarifying') setTimeout(() => clarifyRef.current?.focus(), 100)
  }, [currentIdx, phase])

  const currentQ = QUESTIONS[currentIdx]
  const totalQ = QUESTIONS.length
  const answeredCount = Object.values(answers).filter(
    a => a.status === 'resolved' || a.status === 'low_confidence' || a.status === 'skipped'
  ).length
  const progress = Math.round((answeredCount / totalQ) * 100)

  function saveAnswer(answer: IntakeQuestionAnswer) {
    const updated = { ...answers, [answer.questionId]: answer }
    setAnswers(updated)
    try { localStorage.setItem(BLOCK1_AI_STORAGE_KEY, JSON.stringify(updated)) } catch {}
    return updated
  }

  function resetQuestionState() {
    setPhase('idle')
    setMainInput('')
    setClarificationInput('')
    setClarifyingQuestion('')
    setClarificationHistory([])
    setRawAnswer('')
    setErrorMsg('')
  }

  function advance(updatedAnswers: Block1AIAnswers) {
    const nextIdx = currentIdx + 1
    if (nextIdx >= totalQ) {
      setAllDone(true)
      return
    }
    const nextUnanswered = QUESTIONS.findIndex((q, i) => {
      if (i < nextIdx) return false
      const a = updatedAnswers[q.id]
      return !a || (a.status !== 'resolved' && a.status !== 'low_confidence' && a.status !== 'skipped')
    })
    if (nextUnanswered === -1) {
      setAllDone(true)
      return
    }
    setCurrentIdx(nextUnanswered)
    resetQuestionState()
  }

  async function callClarify(
    qId: string,
    qText: string,
    raw: string,
    history: ClarificationMessage[],
  ) {
    const res = await fetch('/api/assessment/clarify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: qId, questionText: qText, rawAnswer: raw, clarificationHistory: history }),
    })
    if (!res.ok) throw new Error('api_error')
    return res.json() as Promise<{
      done: boolean
      clarifyingQuestion?: string
      finalClarifiedAnswer?: string
      finalTag?: string
      confidence?: 'high' | 'medium' | 'low'
    }>
  }

  async function handleSubmitMain() {
    const input = mainInput.trim()
    if (!input) return
    setPhase('loading')
    setErrorMsg('')
    setRawAnswer(input)
    try {
      const result = await callClarify(currentQ.id, currentQ.text, input, [])
      if (result.done) {
        const answer: IntakeQuestionAnswer = {
          questionId: currentQ.id, rawAnswer: input, clarificationHistory: [],
          finalClarifiedAnswer: result.finalClarifiedAnswer ?? input,
          finalTag: result.finalTag ?? '',
          confidence: result.confidence ?? 'low',
          status: result.confidence === 'low' ? 'low_confidence' : 'resolved',
        }
        const updated = saveAnswer(answer)
        setPhase('resolved')
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
          questionId: currentQ.id, rawAnswer,
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

  function jumpToQuestion(idx: number) {
    const prevAnswer = answers[QUESTIONS[idx]?.id]
    setCurrentIdx(idx)
    setAllDone(false)
    resetQuestionState()
    // Restore raw input if question was previously answered
    if (prevAnswer?.rawAnswer) {
      setMainInput(prevAnswer.rawAnswer)
    }
  }

  function handleBack() {
    if (currentIdx > 0) jumpToQuestion(currentIdx - 1)
  }

  const isLoading = phase === 'loading' || phase === 'clarifying_loading'

  // ── All done state ──────────────────────────────────────────

  if (allDone) {
    return (
      <div style={{ maxWidth: '640px' }}>
        <Link href="/assessment" style={{ fontSize: '13px', color: '#9B8A7A', textDecoration: 'none', display: 'inline-block', marginBottom: '32px' }}>
          ← Диагностика
        </Link>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.08em', marginBottom: '8px', textTransform: 'uppercase' }}>
            Блок 1 — Распаковка основателя
          </div>
          <h1 style={{ fontSize: '22px', color: '#F2EBE1', fontWeight: 500, margin: 0 }}>
            Блок завершён
          </h1>
          <p style={{ fontSize: '14px', color: '#9B8A7A', margin: '8px 0 0' }}>
            {answeredCount} из {totalQ} вопросов зафиксированы
          </p>
        </div>

        {/* Summary of all answers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
          {QUESTIONS.map((q, i) => {
            const a = answers[q.id]
            if (!a) return null
            return (
              <div key={q.id} style={{
                background: '#1A1510',
                border: '1px solid #2A2018',
                borderRadius: '10px',
                padding: '14px 16px',
                cursor: 'pointer',
              }}
                onClick={() => jumpToQuestion(i)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: a.status !== 'skipped' ? '6px' : 0 }}>
                  <span style={{ fontSize: '11px', color: '#5A4A3A', flexShrink: 0 }}>В{i + 1}</span>
                  <span style={{ fontSize: '13px', color: '#9B8A7A', flex: 1 }}>{q.text.slice(0, 60)}...</span>
                  {a.status === 'skipped' ? (
                    <span style={{ fontSize: '11px', color: '#5A4A3A' }}>пропущен</span>
                  ) : a.finalTag ? (
                    <span style={{ fontSize: '11px', color: '#C17F3E', background: '#2A1E10', padding: '2px 8px', borderRadius: '4px', flexShrink: 0 }}>
                      {AI_TAG_LABELS[a.finalTag] ?? a.finalTag}
                    </span>
                  ) : null}
                </div>
                {a.status !== 'skipped' && a.finalClarifiedAnswer && (
                  <div style={{ fontSize: '13px', color: '#7A6A5A', lineHeight: 1.4, paddingLeft: '24px' }}>
                    {a.finalClarifiedAnswer}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/assessment')}
            style={{
              background: '#C17F3E', color: '#0F0D0A', border: 'none',
              borderRadius: '8px', padding: '12px 24px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Перейти к следующему блоку
          </button>
          <button
            onClick={() => jumpToQuestion(0)}
            style={{
              background: 'transparent', border: '1px solid #2A2018', color: '#9B8A7A',
              borderRadius: '8px', padding: '12px 16px', fontSize: '13px', cursor: 'pointer',
            }}
          >
            Пройти заново
          </button>
        </div>
      </div>
    )
  }

  // ── Question flow ───────────────────────────────────────────

  return (
    <div style={{ maxWidth: '640px' }}>
      <Link href="/assessment" style={{ fontSize: '13px', color: '#9B8A7A', textDecoration: 'none', display: 'inline-block', marginBottom: '32px' }}>
        ← Диагностика
      </Link>

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
          <span style={{ fontSize: '12px', color: '#9B8A7A' }}>{currentQ.section}</span>
          <span style={{ fontSize: '12px', color: '#9B8A7A' }}>Вопрос {currentIdx + 1} из {totalQ}</span>
        </div>
        <div style={{ height: '2px', background: '#2A2018', borderRadius: '1px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#C17F3E', borderRadius: '1px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Question card */}
      <div style={{ background: '#1A1510', border: '1px solid #2A2018', borderRadius: '12px', padding: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: '#C17F3E', letterSpacing: '0.08em', marginBottom: '12px' }}>
            ВОПРОС {currentIdx + 1}
          </div>
          <p style={{ fontSize: '17px', color: '#F2EBE1', margin: 0, lineHeight: 1.5 }}>
            {currentQ.text}
          </p>
        </div>

        {/* Main input */}
        {(phase === 'idle' || phase === 'loading' || (phase === 'error' && !clarifyingQuestion)) && (
          <div style={{ marginBottom: '16px' }}>
            <textarea
              ref={textareaRef}
              value={mainInput}
              onChange={e => setMainInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (!isLoading) handleSubmitMain() } }}
              placeholder={currentQ.placeholder}
              disabled={isLoading}
              rows={4}
              style={{
                width: '100%', background: '#0F0D0A', border: '1px solid #2A2018',
                borderRadius: '8px', padding: '14px 16px', fontSize: '15px', color: '#F2EBE1',
                resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                boxSizing: 'border-box', opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s',
              }}
            />
            <div style={{ fontSize: '11px', color: '#5A4A3A', marginTop: '6px' }}>Cmd+Enter для отправки</div>
          </div>
        )}

        {/* Loading */}
        {phase === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '12px 0' }}>
            <LoadingDots />
            <span style={{ fontSize: '13px', color: '#9B8A7A' }}>AI читает ваш ответ...</span>
          </div>
        )}

        {/* Clarifying */}
        {(phase === 'clarifying' || phase === 'clarifying_loading') && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ background: '#0F0D0A', border: '1px solid #2A2018', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#5A4A3A', marginBottom: '4px' }}>Ваш ответ</div>
              <div style={{ fontSize: '14px', color: '#9B8A7A', lineHeight: 1.4 }}>{rawAnswer}</div>
            </div>
            <div style={{ background: '#1E1A14', border: '1px solid #3A2E20', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#C17F3E', marginBottom: '6px', letterSpacing: '0.06em' }}>AI уточняет</div>
              <div style={{ fontSize: '15px', color: '#F2EBE1', lineHeight: 1.5 }}>{clarifyingQuestion}</div>
            </div>
            <textarea
              ref={clarifyRef}
              value={clarificationInput}
              onChange={e => setClarificationInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (!isLoading) handleSubmitClarification() } }}
              placeholder="Ваш ответ на уточнение..."
              disabled={isLoading}
              rows={3}
              style={{
                width: '100%', background: '#0F0D0A', border: '1px solid #2A2018',
                borderRadius: '8px', padding: '14px 16px', fontSize: '15px', color: '#F2EBE1',
                resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                boxSizing: 'border-box', opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s',
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

        {/* Resolved */}
        {phase === 'resolved' && (() => {
          const a = answers[currentQ.id]
          return (
            <div style={{ background: '#0F150D', border: '1px solid #2A3820', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>✓</span>
              <div>
                <div style={{ fontSize: '13px', color: '#7AB87A', marginBottom: '4px' }}>Ответ зафиксирован</div>
                {a?.finalClarifiedAnswer && (
                  <div style={{ fontSize: '14px', color: '#9B8A7A', lineHeight: 1.4 }}>{a.finalClarifiedAnswer}</div>
                )}
                {a?.finalTag && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#C17F3E', background: '#2A1E10', padding: '3px 8px', borderRadius: '4px' }}>
                      {AI_TAG_LABELS[a.finalTag] ?? a.finalTag}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* Error */}
        {phase === 'error' && (
          <div style={{ background: '#150D0D', border: '1px solid #3A2020', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#C07070', marginBottom: '8px' }}>{errorMsg}</div>
            <button onClick={() => { setPhase('idle'); setErrorMsg('') }} style={{ background: 'transparent', border: '1px solid #3A2020', color: '#9B8A7A', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
              Попробовать снова
            </button>
          </div>
        )}

        {/* Buttons */}
        {phase !== 'resolved' && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
            {currentIdx > 0 && !isLoading && phase !== 'clarifying' && (
              <button onClick={handleBack} style={{ background: 'transparent', border: '1px solid #2A2018', color: '#9B8A7A', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', cursor: 'pointer' }}>
                ← Назад
              </button>
            )}
            {(phase === 'idle' || phase === 'loading' || phase === 'error') && (
              <button
                onClick={handleSubmitMain}
                disabled={isLoading || !mainInput.trim()}
                style={{ background: '#C17F3E', color: '#0F0D0A', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: (isLoading || !mainInput.trim()) ? 'not-allowed' : 'pointer', opacity: (isLoading || !mainInput.trim()) ? 0.4 : 1, transition: 'opacity 0.2s' }}
              >
                {isLoading ? 'Обрабатываю...' : 'Продолжить'}
              </button>
            )}
            {(phase === 'clarifying' || phase === 'clarifying_loading') && (
              <button onClick={handleSubmitClarification} disabled={isLoading || !clarificationInput.trim()} style={{ background: '#C17F3E', color: '#0F0D0A', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: (isLoading || !clarificationInput.trim()) ? 'not-allowed' : 'pointer', opacity: (isLoading || !clarificationInput.trim()) ? 0.4 : 1 }}>
                {isLoading ? 'Обрабатываю...' : 'Ответить'}
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C17F3E', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  )
}
