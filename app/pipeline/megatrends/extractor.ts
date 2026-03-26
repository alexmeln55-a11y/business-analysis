// Megatrend extractor — takes article/report text and extracts structured megatrend via LLM.
// No Telegram dependency. Input: any text (news, report, whitepaper).
// Output: partial MegatrendRow ready to insert.

import OpenAI from 'openai'
import crypto from 'crypto'
import { scoreMegatrend } from './scorer'
import { toCanonicalKey, findDuplicate } from './normalizer'
import { getDb } from '../db/client'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface ExtractedMegatrend {
  title: string
  summary: string
  why_growing: string
  time_horizon: string
  geography: string
  vertical: string
  structural_strength: number
  demand_signal: number
  longevity: number
  geographic_spread: number
  clarity_of_need: number
  hype_risk: number
}

const SYSTEM_PROMPT = `
Ты — аналитик мегатрендов. Тебе подают текст статьи, отчёта или публикации.
Извлеки из него один главный мегатренд и верни ТОЛЬКО JSON без markdown.

JSON-схема:
{
  "title":               string,   // краткое название тренда, 4–8 слов
  "summary":             string,   // 1–2 предложения: суть тренда
  "why_growing":         string,   // почему тренд растёт прямо сейчас
  "time_horizon":        string,   // горизонт: "1–2 года" / "3–5 лет" / "5–10 лет"
  "geography":           string,   // "Россия" / "Россия + СНГ" / "Глобально"
  "vertical":            string,   // отрасль: IT / Финансы / Логистика / HR / Здравоохранение / Образование / Ритейл / Строительство / Прочее
  "structural_strength": number,   // 1–10: насколько тренд структурный (не хайп)
  "demand_signal":       number,   // 1–10: рыночный спрос прямо сейчас
  "longevity":           number,   // 1–10: долгосрочность тренда
  "geographic_spread":   number,   // 1–10: охват (1=очень локально, 10=глобально)
  "clarity_of_need":     number,   // 1–10: чёткость и измеримость потребности
  "hype_risk":           number    // 1–10: риск хайпа (10=высокий хайп)
}

Если текст не содержит чёткого мегатренда — верни {"discard": true}.
`.trim()

export async function extractMegatrend(
  text: string,
  sourceName: string,
  sourceUrl?: string,
): Promise<{ inserted: boolean; id?: string; reason?: string }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.15,
    max_tokens: 600,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: text.slice(0, 4000) },
    ],
  })

  const raw = JSON.parse(response.choices[0].message.content ?? '{}')
  if (raw.discard) return { inserted: false, reason: 'no_trend_signal' }

  const extracted = raw as ExtractedMegatrend
  const totalScore = scoreMegatrend(extracted)
  const canonicalKey = toCanonicalKey(extracted.title)

  // Dedup check
  const existing = findDuplicate(canonicalKey)
  if (existing) {
    // Update source list but don't create new record
    const db = getDb()
    db.prepare(`
      UPDATE megatrends
      SET source_name = COALESCE(source_name, '') || ', ' || ?,
          updated_at  = datetime('now')
      WHERE id = ?
    `).run(sourceName, existing.id)
    return { inserted: false, id: existing.id, reason: 'merged_into_existing' }
  }

  const id = `mt_${crypto.randomBytes(6).toString('hex')}`
  const db = getDb()
  db.prepare(`
    INSERT INTO megatrends (
      id, title, summary, why_growing, time_horizon, geography, vertical,
      source_name, source_url,
      structural_strength, demand_signal, longevity, geographic_spread,
      clarity_of_need, hype_risk, total_score,
      status, canonical_key
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      'new', ?
    )
  `).run(
    id, extracted.title, extracted.summary, extracted.why_growing,
    extracted.time_horizon, extracted.geography, extracted.vertical,
    sourceName, sourceUrl ?? null,
    extracted.structural_strength, extracted.demand_signal, extracted.longevity,
    extracted.geographic_spread, extracted.clarity_of_need, extracted.hype_risk,
    totalScore, canonicalKey,
  )

  return { inserted: true, id }
}
