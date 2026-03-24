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

// ── Storage keys ───────────────────────────────────────────────
// Separate key for current question index so it persists across sessions
const BLOCK1_IDX_KEY = 'block1_ai_idx_v1'

// ── Question definitions (4 секции × 4 вопроса = 16) ──────────

const QUESTIONS = [
  { id: 'q1',  section: 'Навыки и монетизация',    text: 'За что вам платили деньги за последние 3 года? Опишите своими словами — что конкретно вы делали.' },
  { id: 'q2',  section: 'Навыки и монетизация',    text: 'В чём вы реально лучше большинства людей вокруг вас? Назовите одну-две вещи, где вы явно сильнее.' },
  { id: 'q3',  section: 'Навыки и монетизация',    text: 'Какие навыки у вас уже оплачены рынком — клиенты или работодатели платили именно за это?' },
  { id: 'q4',  section: 'Навыки и монетизация',    text: 'Что вы умеете делать настолько хорошо, что вас рекомендуют или зовут повторно?' },
  { id: 'q5',  section: 'Рыночный доступ',         text: 'С какими типами клиентов или отраслями вы уже работали? Есть ли контакты, которым можно предложить что-то новое?' },
  { id: 'q6',  section: 'Рыночный доступ',         text: 'Через какой канал вы могли бы найти первых покупателей прямо сейчас?' },
  { id: 'q7',  section: 'Рыночный доступ',         text: 'Есть ли у вас партнёры, поставщики, подрядчики или аудитория, с которой уже есть контакт?' },
  { id: 'q8',  section: 'Рыночный доступ',         text: 'Есть ли у вас люди или компании, которым можно предложить что-то новое — с кем уже есть доверие или история работы?' },
  { id: 'q9',  section: 'Контекст и мотивация',    text: 'Почему вы сейчас ищете новую бизнес-возможность? Что не устраивает в текущей ситуации?' },
  { id: 'q10', section: 'Контекст и мотивация',    text: 'Что вы уже пробовали запускать или менять? Что сработало, а что нет?' },
  { id: 'q11', section: 'Контекст и мотивация',    text: 'Что останавливало вас раньше от запуска нового направления?' },
  { id: 'q12', section: 'Контекст и мотивация',    text: 'Чем вы хотите заниматься — и чем точно не хотите? Что для вас неприемлемо?' },
  { id: 'q13', section: 'Ресурсы и ограничения',   text: 'Сколько времени в неделю вы готовы вкладывать в новое направление?' },
  { id: 'q14', section: 'Ресурсы и ограничения',   text: 'Как быстро вам нужен результат в деньгах? Сколько месяцев без прибыли вы можете выдержать?' },
  { id: 'q15', section: 'Ресурсы и ограничения',   text: 'Какой бюджет вы готовы вложить в запуск?' },
  { id: 'q16', section: 'Ресурсы и ограничения',   text: 'Есть ли у вас помощники, партнёры или команда? Готовы работать в одиночку?' },
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
  const [isMeta, setIsMeta] = useState(false)
  const [clarificationHistory, setClarificationHistory] = useState<ClarificationMessage[]>([])
  const [rawAnswer, setRawAnswer] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const clarifyRef = useRef<HTMLTextAreaElement>(null)

  // ── Persist current question index ────────────────────────────
  function saveIdx(idx: number) {
    try { localStorage.setItem(BLOCK1_IDX_KEY, String(idx)) } catch {}
  }

  // ── Restore phase based on saved answer ───────────────────────
  function restoreQuestionState(savedAnswers: Block1AIAnswers, idx: number) {
    const q = QUESTIONS[idx]
    if (!q) return
    const a = savedAnswers[q.id]
    if (a && (a.status === 'resolved' || a.status === 'low_confidence')) {
      setMainInput(a.rawAnswer)
      setClarificationHistory(a.clarificationHistory)
      setPhase('resolved')
      setClarifyingQuestion('')
      setClarificationInput('')
      setRawAnswer('')
      setErrorMsg('')
    } else if (a?.rawAnswer) {
      // Draft in progress — restore input text
      setMainInput(a.rawAnswer)
      setPhase('idle')
      setClarificationHistory([])
      setClarifyingQuestion('')
      setClarificationInput('')
      setRawAnswer('')
      setErrorMsg('')
    } else {
      resetQuestionState()
    }
  }

  // ── Load from localStorage on mount ───────────────────────────
  useEffect(() => {
    try {
      const savedAnswers = localStorage.getItem(BLOCK1_AI_STORAGE_KEY)
      const savedIdx = localStorage.getItem(BLOCK1_IDX_KEY)

      let parsed: Block1AIAnswers = {}
      if (savedAnswers) {
        parsed = JSON.parse(savedAnswers)
        setAnswers(parsed)
      }

      // Check if all 16 questions are done
      const allAnswered = QUESTIONS.every(q => {
        const a = parsed[q.id]
        return a && (a.status === 'resolved' || a.status === 'low_confidence' || a.status === 'skipped')
      })
      if (allAnswered && Object.keys(parsed).length >= QUESTIONS.length) {
        setAllDone(true)
        return
      }

      // Restore saved index — never compute firstUnanswered to avoid jumps
      let idx = 0
      if (savedIdx !== null) {
        const n = parseInt(savedIdx, 10)
        if (!isNaN(n) && n >= 0 && n < QUESTIONS.length) idx = n
      }
      setCurrentIdx(idx)
      restoreQuestionState(parsed, idx)
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus textarea when question/phase changes
  useEffect(() => {
    if (phase === 'idle') setTimeout(() => textareaRef.current?.focus(), 100)
    if (phase === 'clarifying') setTimeout(() => clarifyRef.current?.focus(), 100)
  }, [currentIdx, phase])

  const currentQ = QUESTIONS[currentIdx]
  const totalQ = QUESTIONS.length
  const answeredCount = Object.values(answers).filter(
    a => a.status === 'resolved' || a.status === 'low_confidence' || a.status === 'skipped'
  ).length
  const progress = Math.round(((currentIdx) / totalQ) * 100)

  // ── Save answer to state + localStorage ───────────────────────
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
    setIsMeta(false)
  }

  // ── Advance: always sequential, never skip questions ──────────
  function advance(updatedAnswers: Block1AIAnswers) {
    const nextIdx = currentIdx + 1
    if (nextIdx >= totalQ) {
      setAllDone(true)
      return
    }
    setCurrentIdx(nextIdx)
    saveIdx(nextIdx)
    restoreQuestionState(updatedAnswers, nextIdx)
  }

  // ── Jump to specific question (back button / review) ──────────
  function jumpToQuestion(idx: number) {
    setCurrentIdx(idx)
    setAllDone(false)
    saveIdx(idx)
    restoreQuestionState(answers, idx)
  }

  function handleBack() {
    if (currentIdx > 0) jumpToQuestion(currentIdx - 1)
  }

  function handleReset() {
    try {
      localStorage.removeItem(BLOCK1_AI_STORAGE_KEY)
      localStorage.removeItem(BLOCK1_IDX_KEY)
    } catch {}
    setAnswers({})
    setCurrentIdx(0)
    setAllDone(false)
    resetQuestionState()
  }

  // ── Dev log helper ────────────────────────────────────────────
  function devLog(label: string, data?: unknown) {
    if (process.env.NODE_ENV !== 'development') return
    if (data !== undefined) {
      console.log(`[Block1] ${label}`, data)
    } else {
      console.log(`[Block1] ${label}`)
    }
  }

  // ── AI API call ───────────────────────────────────────────────
  async function callClarify(
    qId: string,
    qText: string,
    raw: string,
    history: ClarificationMessage[],
  ) {
    devLog('→ AI request', { qId, raw: raw.slice(0, 80), historyLen: history.length })
    const res = await fetch('/api/assessment/clarify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: qId, questionText: qText, rawAnswer: raw, clarificationHistory: history }),
    })
    if (!res.ok) {
      devLog('✗ AI response error', { status: res.status })
      throw new Error('api_error')
    }
    const json = await res.json()
    devLog('← AI response', json)
    return json as {
      done: boolean
      clarifyingQuestion?: string
      finalClarifiedAnswer?: string
      finalTag?: string
      confidence?: 'high' | 'medium' | 'low'
      reason_code?: string
    }
  }

  // ── Submit main answer ────────────────────────────────────────
  async function handleSubmitMain() {
    const input = mainInput.trim()
    if (!input) return
    devLog('submit main', { qId: currentQ.id, input: input.slice(0, 80) })
    setPhase('loading')
    setErrorMsg('')
    setRawAnswer(input)
    try {
      const result = await callClarify(currentQ.id, currentQ.text, input, [])
      if (result.done) {
        devLog('resolved after first answer', { tag: result.finalTag, confidence: result.confidence })
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
        // No auto-advance — user presses "Далее →" manually
        void updated
      } else {
        devLog('clarification needed', { question: result.clarifyingQuestion, reason_code: result.reason_code })
        setClarifyingQuestion(result.clarifyingQuestion ?? 'Уточните, пожалуйста.')
        setClarificationHistory([{ role: 'ai', content: result.clarifyingQuestion ?? '' }])
        setIsMeta(result.reason_code === 'meta_confusion')
        setPhase('clarifying')
      }
    } catch (err) {
      devLog('✗ submit error', err)
      setPhase('error')
      setErrorMsg('Не удалось получить ответ от AI. Попробуйте ещё раз.')
    }
  }

  // ── Submit clarification answer ───────────────────────────────
  async function handleSubmitClarification() {
    const input = clarificationInput.trim()
    if (!input) return
    devLog('submit clarification', { qId: currentQ.id, input: input.slice(0, 80) })
    setPhase('clarifying_loading')
    setErrorMsg('')
    const newHistory: ClarificationMessage[] = [
      ...clarificationHistory,
      { role: 'user', content: input },
    ]
    try {
      const result = await callClarify(currentQ.id, currentQ.text, rawAnswer, newHistory)
      if (result.done) {
        devLog('resolved after clarification', { tag: result.finalTag, confidence: result.confidence })
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
        void updated
      } else {
        devLog('second clarification needed', { question: result.clarifyingQuestion, reason_code: result.reason_code })
        const updatedHistory: ClarificationMessage[] = [
          ...newHistory,
          { role: 'ai', content: result.clarifyingQuestion ?? '' },
        ]
        setClarifyingQuestion(result.clarifyingQuestion ?? 'Уточните, пожалуйста.')
        setClarificationHistory(updatedHistory)
        setIsMeta(result.reason_code === 'meta_confusion')
        setClarificationInput('')
        setPhase('clarifying')
      }
    } catch (err) {
      devLog('✗ clarification error', err)
      setPhase('error')
      setErrorMsg('Не удалось получить ответ от AI. Попробуйте ещё раз.')
    }
  }

  const isLoading = phase === 'loading' || phase === 'clarifying_loading'
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined

  // ── All done screen ───────────────────────────────────────────

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
          <h1 style={{ fontSize: '22px', color: '#F2EBE1', fontWeight: 500, margin: 0 }}>Блок завершён</h1>
          <p style={{ fontSize: '14px', color: '#9B8A7A', margin: '8px 0 0' }}>
            {answeredCount} из {totalQ} вопросов зафиксированы
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
          {QUESTIONS.map((q, i) => {
            const a = answers[q.id]
            if (!a) return null
            return (
              <div key={q.id}
                onClick={() => jumpToQuestion(i)}
                style={{ background: '#1A1510', border: '1px solid #2A2018', borderRadius: '10px', padding: '14px 16px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: a.finalClarifiedAnswer ? '6px' : 0 }}>
                  <span style={{ fontSize: '11px', color: '#5A4A3A', flexShrink: 0 }}>В{i + 1}</span>
                  <span style={{ fontSize: '13px', color: '#9B8A7A', flex: 1 }}>{q.text.slice(0, 60)}...</span>
                  {a.finalTag && a.status !== 'skipped' ? (
                    <span style={{ fontSize: '11px', color: '#C17F3E', background: '#2A1E10', padding: '2px 8px', borderRadius: '4px', flexShrink: 0 }}>
                      {AI_TAG_LABELS[a.finalTag] ?? a.finalTag}
                    </span>
                  ) : <span style={{ fontSize: '11px', color: '#5A4A3A' }}>пропущен</span>}
                </div>
                {a.finalClarifiedAnswer && (
                  <div style={{ fontSize: '13px', color: '#7A6A5A', lineHeight: 1.4, paddingLeft: '24px' }}>
                    {a.finalClarifiedAnswer}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => router.push('/assessment')} style={{ background: '#C17F3E', color: '#0F0D0A', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Перейти к следующему блоку
          </button>
          <button onClick={handleReset} style={{ background: 'transparent', border: '1px solid #2A2018', color: '#9B8A7A', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', cursor: 'pointer' }}>
            Пройти заново
          </button>
        </div>
      </div>
    )
  }

  // ── Question flow ─────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '640px' }}>
      <Link href="/assessment" style={{ fontSize: '13px', color: '#9B8A7A', textDecoration: 'none', display: 'inline-block', marginBottom: '32px' }}>
        ← Диагностика
      </Link>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.08em', marginBottom: '8px', textTransform: 'uppercase' }}>
          Блок 1 — Распаковка основателя
        </div>
        <h1 style={{ fontSize: '22px', color: '#F2EBE1', fontWeight: 500, margin: 0 }}>Расскажите своими словами</h1>
        <p style={{ fontSize: '14px', color: '#9B8A7A', margin: '8px 0 0' }}>
          AI уточнит смысл, если нужно — и зафиксирует ваш профиль
        </p>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#9B8A7A' }}>{currentQ?.section}</span>
          <span style={{ fontSize: '12px', color: '#9B8A7A' }}>Вопрос {currentIdx + 1} из {totalQ}</span>
        </div>
        <div style={{ height: '2px', background: '#2A2018', borderRadius: '1px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#C17F3E', borderRadius: '1px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Question card */}
      <div style={{ background: '#1A1510', border: '1px solid #2A2018', borderRadius: '12px', padding: '32px' }}>

        {/* Question header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: '#C17F3E', letterSpacing: '0.08em', marginBottom: '12px' }}>
            ВОПРОС {currentIdx + 1}
          </div>
          <p style={{ fontSize: '17px', color: '#F2EBE1', margin: 0, lineHeight: 1.5 }}>
            {currentQ?.text}
          </p>
        </div>

        {/* ── idle / loading / error: main input ── */}
        {(phase === 'idle' || phase === 'loading' || (phase === 'error' && !clarifyingQuestion)) && (
          <div style={{ marginBottom: '16px' }}>
            <textarea
              ref={textareaRef}
              value={mainInput}
              onChange={e => setMainInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (!isLoading) handleSubmitMain() } }}
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

        {/* ── loading indicator ── */}
        {phase === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '12px 0' }}>
            <LoadingDots />
            <span style={{ fontSize: '13px', color: '#9B8A7A' }}>AI читает ваш ответ...</span>
          </div>
        )}

        {/* ── clarifying flow ── */}
        {(phase === 'clarifying' || phase === 'clarifying_loading') && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ background: '#0F0D0A', border: '1px solid #2A2018', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#5A4A3A', marginBottom: '4px' }}>Ваш ответ</div>
              <div style={{ fontSize: '14px', color: '#9B8A7A', lineHeight: 1.4 }}>{rawAnswer}</div>
            </div>
            <div style={{ background: isMeta ? '#141820' : '#1E1A14', border: `1px solid ${isMeta ? '#2A3A50' : '#3A2E20'}`, borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: isMeta ? '#7A9EC0' : '#C17F3E', marginBottom: '6px', letterSpacing: '0.06em' }}>
                {isMeta ? 'Уточним вопрос' : 'AI уточняет'}
              </div>
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

        {/* ── resolved state ── */}
        {phase === 'resolved' && (
          <div style={{ background: '#0F150D', border: '1px solid #2A3820', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>✓</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#7AB87A', marginBottom: '6px' }}>Ответ зафиксирован</div>
              {currentAnswer?.finalClarifiedAnswer && (
                <div style={{ fontSize: '14px', color: '#9B8A7A', lineHeight: 1.4, marginBottom: '8px' }}>
                  {currentAnswer.finalClarifiedAnswer}
                </div>
              )}
              {currentAnswer?.finalTag && (
                <span style={{ fontSize: '11px', color: '#C17F3E', background: '#2A1E10', padding: '3px 8px', borderRadius: '4px' }}>
                  {AI_TAG_LABELS[currentAnswer.finalTag] ?? currentAnswer.finalTag}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── error state ── */}
        {phase === 'error' && (
          <div style={{ background: '#150D0D', border: '1px solid #3A2020', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#C07070', marginBottom: '8px' }}>{errorMsg}</div>
            <button onClick={() => { setPhase('idle'); setErrorMsg('') }} style={{ background: 'transparent', border: '1px solid #3A2020', color: '#9B8A7A', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
              Попробовать снова
            </button>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>

          {/* Back */}
          {currentIdx > 0 && !isLoading && phase !== 'clarifying' && phase !== 'clarifying_loading' && (
            <button onClick={handleBack} style={{ background: 'transparent', border: '1px solid #2A2018', color: '#9B8A7A', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', cursor: 'pointer' }}>
              ← Назад
            </button>
          )}

          {/* Continue — main input */}
          {(phase === 'idle' || phase === 'loading' || phase === 'error') && (
            <button
              onClick={handleSubmitMain}
              disabled={isLoading || !mainInput.trim()}
              style={{ background: '#C17F3E', color: '#0F0D0A', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: (isLoading || !mainInput.trim()) ? 'not-allowed' : 'pointer', opacity: (isLoading || !mainInput.trim()) ? 0.4 : 1, transition: 'opacity 0.2s' }}
            >
              {isLoading ? 'Обрабатываю...' : 'Продолжить'}
            </button>
          )}

          {/* Submit clarification */}
          {(phase === 'clarifying' || phase === 'clarifying_loading') && (
            <button
              onClick={handleSubmitClarification}
              disabled={isLoading || !clarificationInput.trim()}
              style={{ background: '#C17F3E', color: '#0F0D0A', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: (isLoading || !clarificationInput.trim()) ? 'not-allowed' : 'pointer', opacity: (isLoading || !clarificationInput.trim()) ? 0.4 : 1 }}
            >
              {isLoading ? 'Обрабатываю...' : 'Ответить'}
            </button>
          )}

          {/* Resolved: "Далее" button (skip re-calling AI) + "Изменить" */}
          {phase === 'resolved' && (
            <>
              <button
                onClick={() => advance(answers)}
                style={{ background: '#C17F3E', color: '#0F0D0A', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Далее →
              </button>
              <button
                onClick={() => { setPhase('idle'); setMainInput(currentAnswer?.rawAnswer ?? '') }}
                style={{ background: 'transparent', border: '1px solid #2A2018', color: '#9B8A7A', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', cursor: 'pointer' }}
              >
                Изменить
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Loading dots ───────────────────────────────────────────────

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
