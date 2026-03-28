// Megatrend extractor — Upgrade-01a
//
// Flow:
//   1. LLM: extract structural fields from article text
//   2. Freshness gate: reject articles older than FRESHNESS_WINDOW_DAYS
//   3. Save as megatrend_signal (atomic record)
//   4. Find or create parent megatrend topic (Jaccard dedup)
//   5. Link signal → megatrend, recalculate metrics + confirmation_status
//   6. LLM scoring only on NEW megatrend creation (calibrated anchors)
//
// A single article CANNOT create a confirmed megatrend on its own.
// confirmation_status progresses: signal → topic → candidate (→ confirmed in 01b)

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
import { saveSignalAndRecalculate, isArticleFresh } from './signals'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface ExtractedFields {
  title: string
  summary: string
  why_growing: string
  time_horizon: string
  geography: string
  vertical: string
  published_at?: string  // ISO date if detectable from article, else omitted
  region?: string
}

const EXTRACT_PROMPT = `
Ты — аналитик мегатрендов. Тебе подают текст статьи, отчёта или публикации.
Извлеки из него один главный мегатренд и верни ТОЛЬКО JSON без markdown.

JSON-схема:
{
  "title":        string,       // краткое название тренда, 4–8 слов
  "summary":      string,       // 1–2 предложения: суть тренда
  "why_growing":  string,       // почему тренд растёт прямо сейчас (отличается от summary)
  "time_horizon": string,       // горизонт: "1–2 года" / "3–5 лет" / "5–10 лет"
  "geography":    string,       // "Россия" / "Россия + СНГ" / "Глобально"
  "vertical":     string,       // отрасль: IT / Финансы / Логистика / HR / Здравоохранение / Образование / Ритейл / Строительство / Прочее
  "region":       string | null // регион публикации если явно указан, иначе null
}

Если текст не содержит чёткого мегатренда — верни {"discard": true}.
`.trim()

export interface ExtractResult {
  inserted: boolean
  signalId?: string
  megatrendId?: string
  reason?: string
  isNewMegatrend?: boolean
}

export async function extractMegatrend(
  text: string,
  sourceName: string,
  sourceUrl?: string,
  publishedAt?: string,  // ISO date from RSS/page metadata; fallback = now
): Promise<ExtractResult> {
  // ── Step 1: Extract structural fields ────────────────────────────────────────
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

  // ── Step 2: Freshness gate ────────────────────────────────────────────────────
  // Use publishedAt from caller (RSS metadata) first, then from LLM extraction, then now.
  const articleDate = publishedAt ?? extracted.published_at ?? new Date().toISOString()

  if (!isArticleFresh(articleDate)) {
    return { inserted: false, reason: 'article_too_old' }
  }

  // ── Step 3: Find or create parent megatrend (by Jaccard dedup) ───────────────
  const canonicalKey = toCanonicalKey(extracted.title)
  const existing = findDuplicate(canonicalKey)

  let megatrendId: string
  let isNewMegatrend = false

  if (existing) {
    // Merge into existing megatrend topic
    megatrendId = existing.id
    // Append source_name to the megatrend (legacy field, keep for display)
    getDb().prepare(`
      UPDATE megatrends
      SET source_name = COALESCE(source_name, '') || ', ' || ?,
          updated_at  = datetime('now')
      WHERE id = ?
    `).run(sourceName, megatrendId)
  } else {
    // ── Step 4: Create new megatrend (score only on first creation) ─────────────
    const scores = await getCalibatedScores(extracted.title, extracted.summary, extracted.why_growing)
    const totalScore = scoreMegatrend(scores)
    const status = statusFromScore(totalScore)

    megatrendId = `mt_${crypto.randomBytes(6).toString('hex')}`
    isNewMegatrend = true

    getDb().prepare(`
      INSERT INTO megatrends (
        id, title, summary, why_growing, time_horizon, geography, vertical,
        source_name, source_url,
        structural_strength, demand_signal, longevity, geographic_spread,
        clarity_of_need, hype_risk, total_score,
        structural_strength_reason, demand_signal_reason, longevity_reason,
        geographic_spread_reason, clarity_of_need_reason, hype_risk_reason,
        status, canonical_key,
        confirmation_status, first_seen_at, last_seen_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        'signal', ?, ?
      )
    `).run(
      megatrendId, extracted.title, extracted.summary, extracted.why_growing,
      extracted.time_horizon, extracted.geography, extracted.vertical,
      sourceName, sourceUrl ?? null,
      scores.structural_strength, scores.demand_signal, scores.longevity,
      scores.geographic_spread, scores.clarity_of_need, scores.hype_risk, totalScore,
      scores.structural_strength_reason, scores.demand_signal_reason, scores.longevity_reason,
      scores.geographic_spread_reason, scores.clarity_of_need_reason, scores.hype_risk_reason,
      status, canonicalKey,
      articleDate, articleDate,
    )
  }

  // ── Step 5: Save signal + recalculate metrics ─────────────────────────────────
  const signalId = saveSignalAndRecalculate({
    megatrendId,
    title:      extracted.title,
    summary:    extracted.summary,
    sourceName,
    sourceUrl,
    publishedAt: articleDate,
    region:     extracted.region ?? undefined,
    vertical:   extracted.vertical,
    rawText:    text.slice(0, 2000),
    confidence: 0.75,
  })

  return { inserted: true, signalId, megatrendId, isNewMegatrend }
}
