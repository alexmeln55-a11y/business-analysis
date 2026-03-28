// semantic-checker.ts — Shifts-01
//
// Two-step semantic check for shift topics.
// Does NOT ask "is this a decade-long global megatrend?".
// Asks: is this a repeating, growing early market shift with a business angle?
//
// STEP 1 (checker): 5 questions focused on shift characteristics.
// STEP 2 (critic):  Checks for news-vs-shift confusion and logical gaps.
//
// Outcome:
//   confirmed_shift  — if ≥ 4/5 yes AND critic approves
//   topic            — if 2–3/5 yes OR critic downgrades
//   signal           — if ≤ 1/5 yes OR critic rejects

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import OpenAI from 'openai'
import type { ConfirmationStatus, Priority } from '../types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Topic critic (soft gate: signal → topic) ──────────────────────────────────
//
// Runs after numeric promotion (2+ sources OR 3+ signals).
// Checks only basic quality — is this a real repeating pattern, not just noise?
// Lenient by design: only reject if clearly broken.

const TOPIC_CRITIC_PROMPT = `
Ты — мягкий критик рыночных сигналов. Тема набрала достаточно сигналов и теперь претендует на статус "topic".

Проверь только 4 базовых критерия:
1. Это не просто пересказ одной новости разными словами?
2. Сигналы похожи по смыслу, а не только по ключевым словам?
3. Тема встречается хотя бы в двух разных контекстах или периодах?
4. Тема не слишком узкая (конкретный продукт, персона, разовое событие)?

Правило: будь мягким. Если тема выглядит как повторяющееся движение — одобряй.
Отклоняй только если тема провалила 2 и более критерия явно.

Верни ТОЛЬКО JSON без markdown:
{
  "verdict": "approve" | "reject",
  "reason": "одно предложение — почему"
}
`.trim()

export interface TopicCheckResult {
  verdict: 'approve' | 'reject'
  reason: string
}

export async function checkTopicPromotion(
  title: string,
  summary: string,
  signalsCount: number,
  uniqueSourcesCount: number,
): Promise<TopicCheckResult> {
  const context = [
    `Тема: ${title}`,
    `Суть: ${summary}`,
    `Сигналов: ${signalsCount}, уникальных источников: ${uniqueSourcesCount}`,
  ].join('\n')

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.05,
    max_tokens: 150,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: TOPIC_CRITIC_PROMPT },
      { role: 'user',   content: context },
    ],
  })

  const raw = JSON.parse(res.choices[0].message.content ?? '{}') as {
    verdict?: string
    reason?: string
  }

  const verdict = raw.verdict === 'approve' ? 'approve' : 'reject'
  const reason  = raw.reason ?? (verdict === 'approve' ? 'одобрено' : 'отклонено')

  return { verdict, reason }
}

// ── Step 1: Shift checker ─────────────────────────────────────────────────────

const CHECKER_PROMPT = `
Ты — аналитик ранних рыночных сдвигов. Не спрашивай, "мегатренд" ли это на 10 лет.
Проверь только одно: есть ли здесь ранний рыночный сдвиг — что-то реальное, повторяющееся и растущее.

5 вопросов (каждый: true/false + reason 1 предложение):

1. repeats_across_sources — тема встречается в нескольких независимых источниках или контекстах, а не только в одной статье?
2. signal_is_growing — есть признаки того, что тема усиливается: рост упоминаний, действий, денег, регуляторики?
3. reason_is_clear — причина роста понятна и объяснима (не просто "тема популярна", а есть конкретный драйвер)?
4. not_a_one_time_event — тема не привязана к разовому событию (конференции, скандалу, одной новости)?
5. has_business_angle — из этой темы видна новая потребность, незакрытый рынок или окно для бизнеса?

Вердикт:
- "confirmed_shift" если ≥ 4/5 true
- "topic" если 2–3/5 true
- "not_a_shift" если ≤ 1/5 true

Priority:
- "high" если 5/5 или 4/5 с сильным бизнес-углом
- "medium" если 3–4/5
- "low" если 0–2/5

Верни ТОЛЬКО JSON без markdown:
{
  "repeats_across_sources": bool,
  "repeats_across_sources_reason": "...",
  "signal_is_growing": bool,
  "signal_is_growing_reason": "...",
  "reason_is_clear": bool,
  "reason_is_clear_reason": "...",
  "not_a_one_time_event": bool,
  "not_a_one_time_event_reason": "...",
  "has_business_angle": bool,
  "has_business_angle_reason": "...",
  "priority": "high" | "medium" | "low",
  "verdict": "confirmed_shift" | "topic" | "not_a_shift"
}
`.trim()

// ── Step 2: Critic ────────────────────────────────────────────────────────────

const CRITIC_PROMPT = `
Ты — критик ранних рыночных сдвигов. Тебе показывают вывод аналитика.
Твоя задача — найти слабые места и либо подтвердить вывод, либо понизить его.

Проверь:
1. Это точно не просто одна новость, переформулированная как "тема"?
2. Если вердикт "confirmed_shift" — есть ли реальные основания, или это натяжка?
3. Причина роста понятна или аналитик просто предположил?
4. Реально ли из этого вытекает бизнес-возможность, или это общее место?

Вердикт:
- "approve" — вывод обоснован
- "downgrade" — вывод завышен (confirmed_shift → topic, topic → signal)
- "reject" — это не рыночный сдвиг вообще

Верни ТОЛЬКО JSON без markdown:
{
  "verdict": "approve" | "downgrade" | "reject",
  "issues": ["...", "..."],
  "reasoning": "1–2 предложения"
}
`.trim()

// ── Types ─────────────────────────────────────────────────────────────────────

interface CheckerRaw {
  repeats_across_sources: boolean
  repeats_across_sources_reason: string
  signal_is_growing: boolean
  signal_is_growing_reason: string
  reason_is_clear: boolean
  reason_is_clear_reason: string
  not_a_one_time_event: boolean
  not_a_one_time_event_reason: string
  has_business_angle: boolean
  has_business_angle_reason: string
  priority: Priority
  verdict: 'confirmed_shift' | 'topic' | 'not_a_shift'
}

interface CriticRaw {
  verdict: 'approve' | 'downgrade' | 'reject'
  issues: string[]
  reasoning: string
}

export interface SemanticCheckResult {
  repeats_across_sources: boolean
  signal_is_growing: boolean
  reason_is_clear: boolean
  not_a_one_time_event: boolean
  has_business_angle: boolean
  yes_count: number
  confirmation_status: ConfirmationStatus
  priority: Priority
  critic_verdict: 'approve' | 'downgrade' | 'reject'
  critic_issues: string[]
  checker_reasoning: string
  critic_reasoning: string
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function checkMegatrendSemantic(
  title: string,
  summary: string,
  whyGrowing: string | null,
): Promise<SemanticCheckResult> {
  const context = [
    `Тема: ${title}`,
    `Суть: ${summary}`,
    whyGrowing ? `Почему растёт: ${whyGrowing}` : '',
  ].filter(Boolean).join('\n')

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const checkerRes = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.05,
    max_tokens: 600,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: CHECKER_PROMPT },
      { role: 'user',   content: context },
    ],
  })

  const checker = JSON.parse(checkerRes.choices[0].message.content ?? '{}') as CheckerRaw

  const yesCount = [
    checker.repeats_across_sources,
    checker.signal_is_growing,
    checker.reason_is_clear,
    checker.not_a_one_time_event,
    checker.has_business_angle,
  ].filter(Boolean).length

  // Clamp verdict against yes_count to prevent LLM overreach
  let checkerVerdict = checker.verdict
  if (yesCount < 2) checkerVerdict = 'not_a_shift'
  if (yesCount < 4 && checkerVerdict === 'confirmed_shift') checkerVerdict = 'topic'

  const checkerReasoning = [
    checker.repeats_across_sources_reason,
    checker.signal_is_growing_reason,
    checker.reason_is_clear_reason,
    checker.not_a_one_time_event_reason,
    checker.has_business_angle_reason,
  ].filter(Boolean).join(' ')

  // ── Step 2: Critic ────────────────────────────────────────────────────────
  const criticInput = [
    context,
    `\nВывод аналитика: ${checkerVerdict} (${yesCount}/5)`,
    `Приоритет: ${checker.priority}`,
    `Обоснование: ${checkerReasoning}`,
  ].join('\n')

  const criticRes = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.10,
    max_tokens: 300,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: CRITIC_PROMPT },
      { role: 'user',   content: criticInput },
    ],
  })

  const critic = JSON.parse(criticRes.choices[0].message.content ?? '{}') as CriticRaw

  // ── Combine ───────────────────────────────────────────────────────────────
  let finalStatus: ConfirmationStatus
  let finalPriority: Priority = checker.priority ?? 'medium'

  if (critic.verdict === 'reject') {
    finalStatus = 'signal'
    finalPriority = 'low'
  } else if (critic.verdict === 'downgrade') {
    if (checkerVerdict === 'confirmed_shift') finalStatus = 'topic'
    else finalStatus = 'signal'
    if (finalPriority === 'high') finalPriority = 'medium'
  } else {
    if (checkerVerdict === 'confirmed_shift') finalStatus = 'confirmed_shift'
    else if (checkerVerdict === 'topic') finalStatus = 'topic'
    else finalStatus = 'signal'
  }

  return {
    repeats_across_sources: checker.repeats_across_sources ?? false,
    signal_is_growing:      checker.signal_is_growing ?? false,
    reason_is_clear:        checker.reason_is_clear ?? false,
    not_a_one_time_event:   checker.not_a_one_time_event ?? false,
    has_business_angle:     checker.has_business_angle ?? false,
    yes_count:              yesCount,
    confirmation_status:    finalStatus,
    priority:               finalPriority,
    critic_verdict:         critic.verdict ?? 'approve',
    critic_issues:          critic.issues ?? [],
    checker_reasoning:      checkerReasoning,
    critic_reasoning:       critic.reasoning ?? '',
  }
}
