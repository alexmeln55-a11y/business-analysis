// Megatrend extractor — takes article/report text and extracts structured megatrend via LLM.
// Extraction (title/summary/why_growing/vertical/geography) and scoring are two separate LLM calls:
//   1. Extract structural fields (fast, low temp)
//   2. Score with calibrated anchors (calibrated-scorer.ts)

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import OpenAI from 'openai'
import crypto from 'crypto'
import { scoreMegatrend, statusFromScore } from './scorer'
import { toCanonicalKey, findDuplicate } from './normalizer'
import { getCalibatedScores } from './calibrated-scorer'
import { getDb } from '../db/client'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface ExtractedFields {
  title: string
  summary: string
  why_growing: string
  time_horizon: string
  geography: string
  vertical: string
}

const EXTRACT_PROMPT = `
Ты — аналитик мегатрендов. Тебе подают текст статьи, отчёта или публикации.
Извлеки из него один главный мегатренд и верни ТОЛЬКО JSON без markdown.

JSON-схема:
{
  "title":       string,  // краткое название тренда, 4–8 слов
  "summary":     string,  // 1–2 предложения: суть тренда
  "why_growing": string,  // почему тренд растёт прямо сейчас (отличается от summary)
  "time_horizon": string, // горизонт: "1–2 года" / "3–5 лет" / "5–10 лет"
  "geography":   string,  // "Россия" / "Россия + СНГ" / "Глобально"
  "vertical":    string   // отрасль: IT / Финансы / Логистика / HR / Здравоохранение / Образование / Ритейл / Строительство / Прочее
}

Если текст не содержит чёткого мегатренда — верни {"discard": true}.
`.trim()

export async function extractMegatrend(
  text: string,
  sourceName: string,
  sourceUrl?: string,
): Promise<{ inserted: boolean; id?: string; reason?: string }> {
  // Step 1: Extract structural fields
  const extractRes = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.10,
    max_tokens: 400,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: EXTRACT_PROMPT },
      { role: 'user',   content: text.slice(0, 4000) },
    ],
  })

  const raw = JSON.parse(extractRes.choices[0].message.content ?? '{}')
  if (raw.discard) return { inserted: false, reason: 'no_trend_signal' }

  const extracted = raw as ExtractedFields
  const canonicalKey = toCanonicalKey(extracted.title)

  // Dedup check
  const existing = findDuplicate(canonicalKey)
  if (existing) {
    const db = getDb()
    db.prepare(`
      UPDATE megatrends
      SET source_name = COALESCE(source_name, '') || ', ' || ?,
          updated_at  = datetime('now')
      WHERE id = ?
    `).run(sourceName, existing.id)
    return { inserted: false, id: existing.id, reason: 'merged_into_existing' }
  }

  // Step 2: Calibrated scoring
  const scores = await getCalibatedScores(extracted.title, extracted.summary, extracted.why_growing)
  const totalScore = scoreMegatrend(scores)
  const status = statusFromScore(totalScore)

  const id = `mt_${crypto.randomBytes(6).toString('hex')}`
  const db = getDb()
  db.prepare(`
    INSERT INTO megatrends (
      id, title, summary, why_growing, time_horizon, geography, vertical,
      source_name, source_url,
      structural_strength, demand_signal, longevity, geographic_spread,
      clarity_of_need, hype_risk, total_score,
      structural_strength_reason, demand_signal_reason, longevity_reason,
      geographic_spread_reason, clarity_of_need_reason, hype_risk_reason,
      status, canonical_key
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?
    )
  `).run(
    id, extracted.title, extracted.summary, extracted.why_growing,
    extracted.time_horizon, extracted.geography, extracted.vertical,
    sourceName, sourceUrl ?? null,
    scores.structural_strength, scores.demand_signal, scores.longevity,
    scores.geographic_spread, scores.clarity_of_need, scores.hype_risk, totalScore,
    scores.structural_strength_reason, scores.demand_signal_reason, scores.longevity_reason,
    scores.geographic_spread_reason, scores.clarity_of_need_reason, scores.hype_risk_reason,
    status, canonicalKey,
  )

  return { inserted: true, id }
}
