import OpenAI from 'openai'
import crypto from 'crypto'
import { getDb } from '../db/client'
import { TOPICS, isLikelyPainSignal } from './config'
import type { RawSignalRow } from '../types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const EXTRACT_PROMPT = `Ты — аналитик рыночных болей. Твоя задача — извлекать структурированные данные о болях из текста.

Текст может быть сообщением из Telegram-канала или чата.

Если в тексте есть явная боль, проблема или жалоба — извлеки её.
Если текст — реклама, новость без жалобы, поздравление или не содержит боли — верни {"discard":true}.

Верни JSON строго в одном из двух форматов:

1. Если боль найдена:
{
  "segment": "кто страдает (тип компании или человека)",
  "pain": "краткое описание боли (1-2 предложения, суть проблемы)",
  "context": "в каком контексте это происходит",
  "workaround": "как люди сейчас решают это (если упомянуто)",
  "consequence": "к чему приводит эта боль",
  "confidence": 0.0-1.0
}

2. Если боли нет:
{"discard": true}

Отвечай только JSON, без пояснений.`

interface ExtractedPain {
  discard?: boolean
  segment?: string
  pain?: string
  context?: string
  workaround?: string
  consequence?: string
  confidence?: number
}

async function extractFromSignal(text: string): Promise<ExtractedPain> {
  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        { role: 'system', content: EXTRACT_PROMPT },
        { role: 'user', content: text.slice(0, 1500) },
      ],
    })
    const raw = resp.choices[0].message.content ?? '{}'
    return JSON.parse(raw) as ExtractedPain
  } catch {
    return { discard: true }
  }
}

export async function runExtraction(batchSize = 50): Promise<void> {
  const db = getDb()

  // Get unprocessed signals
  const signals = db.prepare(`
    SELECT s.* FROM raw_signals s
    WHERE NOT EXISTS (
      SELECT 1 FROM candidate_pains c WHERE c.signal_id = s.signal_id
    )
    ORDER BY s.date DESC
    LIMIT ?
  `).all(batchSize) as RawSignalRow[]

  if (!signals.length) {
    console.log('No unprocessed signals')
    return
  }

  console.log(`Processing ${signals.length} signals...`)

  const insertCandidate = db.prepare(`
    INSERT OR IGNORE INTO candidate_pains
      (candidate_id, signal_id, topic_id, segment, pain, context, workaround,
       consequence, extraction_confidence, extraction_status)
    VALUES
      (@candidate_id, @signal_id, @topic_id, @segment, @pain, @context,
       @workaround, @consequence, @extraction_confidence, @extraction_status)
  `)

  // Marker for discarded signals (so we don't reprocess)
  const markDiscarded = db.prepare(`
    INSERT OR IGNORE INTO candidate_pains
      (candidate_id, signal_id, topic_id, pain, extraction_status)
    VALUES
      (@candidate_id, @signal_id, 'none', 'discarded', 'discarded')
  `)

  let extracted = 0
  let discarded = 0

  for (const signal of signals) {
    // Check if any topic's patterns match
    const matchedTopics = TOPICS.filter(t => isLikelyPainSignal(signal.raw_text, t))

    if (!matchedTopics.length) {
      markDiscarded.run({ candidate_id: crypto.randomUUID(), signal_id: signal.signal_id })
      discarded++
      continue
    }

    // Use AI extraction (once per signal, for primary matched topic)
    const topic = matchedTopics[0]
    const result = await extractFromSignal(signal.raw_text)

    if (result.discard || !result.pain) {
      markDiscarded.run({ candidate_id: crypto.randomUUID(), signal_id: signal.signal_id })
      discarded++
      continue
    }

    insertCandidate.run({
      candidate_id: crypto.randomUUID(),
      signal_id: signal.signal_id,
      topic_id: topic.topic_id,
      segment: result.segment ?? null,
      pain: result.pain,
      context: result.context ?? null,
      workaround: result.workaround ?? null,
      consequence: result.consequence ?? null,
      extraction_confidence: result.confidence ?? 0.5,
      extraction_status: 'accepted',
    })
    extracted++

    // Brief pause to avoid rate limits
    await new Promise(r => setTimeout(r, 100))
  }

  console.log(`Extracted: ${extracted}, Discarded: ${discarded}`)
}
