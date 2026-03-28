// signals.ts — Shifts-01
// Handles saving article-level signals and recalculating confirmation_status on the parent shift topic.
//
// Rules (Shifts-01):
//   unique_sources_count == 1  → 'signal'   (one article, not yet a topic)
//   unique_sources_count >= 2  → 'topic'    (ready for semantic shift check)
//   'confirmed_shift' is set ONLY by the semantic checker (confirm-megatrends script)
//
// Freshness gate: articles older than FRESHNESS_WINDOW_DAYS are rejected as a basis for NEW topics.
// They can still be linked to an existing topic for enrichment, but cannot create one.

import crypto from 'crypto'
import { getDb } from '../db/client'
import type { MegatrendSignalRow, ConfirmationStatus } from '../types'

export const FRESHNESS_WINDOW_DAYS = 90
export const SIGNAL_WINDOW_DAYS    = 30  // primary window — signals must fall here to count as "active"

// ── Freshness check ───────────────────────────────────────────────────────────

export function isArticleFresh(publishedAt: string): boolean {
  const pub = new Date(publishedAt).getTime()
  if (isNaN(pub)) return false
  const cutoff = Date.now() - FRESHNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000
  return pub >= cutoff
}

// ── Confirmation status derivation ────────────────────────────────────────────

export function deriveConfirmationStatus(
  uniqueSourcesCount: number,
  current: ConfirmationStatus,
  signalsCount: number = 0,
): ConfirmationStatus {
  // Never downgrade a confirmed_shift — that's the semantic checker's job
  if (current === 'confirmed_shift') return 'confirmed_shift'
  // Legacy: also protect 'confirmed' from Upgrade-01b
  if (current === 'confirmed') return 'confirmed'
  // Two paths to 'topic':
  //   1. Cross-source: signals from 2+ different sources (strongest evidence)
  //   2. Volume: 3+ signals even from same source (e.g. Habr dominating RU market)
  if (uniqueSourcesCount >= 2) return 'topic'
  if (signalsCount >= 3) return 'topic'
  return 'signal'
}

// ── Save signal and recalculate parent megatrend metrics ──────────────────────

interface SaveSignalInput {
  megatrendId: string
  title: string
  summary: string
  sourceName: string
  sourceUrl?: string
  publishedAt: string
  region?: string
  vertical?: string
  rawText?: string
  confidence?: number
}

export function saveSignalAndRecalculate(input: SaveSignalInput): string {
  const db = getDb()

  const signalId = `sig_${crypto.randomBytes(6).toString('hex')}`

  db.prepare(`
    INSERT INTO megatrend_signals
      (id, megatrend_id, title, summary, source_name, source_url, published_at, region, vertical, raw_text, confidence)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    signalId,
    input.megatrendId,
    input.title,
    input.summary,
    input.sourceName,
    input.sourceUrl ?? null,
    input.publishedAt,
    input.region ?? null,
    input.vertical ?? null,
    input.rawText ?? null,
    input.confidence ?? 0.7,
  )

  recalculateMegatrendMetrics(input.megatrendId)

  return signalId
}

// ── Recalculate metrics for one megatrend from its linked signals ─────────────

export function recalculateMegatrendMetrics(megatrendId: string): void {
  const db = getDb()

  const signals = db.prepare(`
    SELECT source_name, published_at, region
    FROM megatrend_signals
    WHERE megatrend_id = ?
    ORDER BY published_at ASC
  `).all(megatrendId) as Array<{ source_name: string; published_at: string; region: string | null }>

  if (!signals.length) return

  const uniqueSources = new Set(signals.map(s => s.source_name.trim().toLowerCase()))
  const uniqueRegions = new Set(
    signals.map(s => (s.region ?? '').trim().toLowerCase()).filter(Boolean),
  )

  const dates = signals
    .map(s => new Date(s.published_at).getTime())
    .filter(d => !isNaN(d))
    .sort((a, b) => a - b)

  const firstSeenAt = dates.length ? new Date(dates[0]).toISOString() : null
  const lastSeenAt  = dates.length ? new Date(dates[dates.length - 1]).toISOString() : null

  let activeDays = 1
  if (firstSeenAt && lastSeenAt) {
    const diff = new Date(lastSeenAt).getTime() - new Date(firstSeenAt).getTime()
    activeDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1)
  }

  // Read current confirmation_status so we never accidentally downgrade 'confirmed'
  const current = db.prepare(`SELECT confirmation_status FROM megatrends WHERE id = ?`).get(megatrendId) as
    | { confirmation_status: ConfirmationStatus }
    | undefined

  const currentStatus = current?.confirmation_status ?? 'signal'
  const newStatus = deriveConfirmationStatus(
    uniqueSources.size,
    currentStatus,
    signals.length,
  )

  // Pipeline-09: reset topic critic when record transitions signal→topic.
  // The dedup critic pass will re-evaluate it. If status stays 'topic' (already
  // approved), we leave topic_critic_verdict intact so it isn't re-checked needlessly.
  const wasJustPromoted = currentStatus === 'signal' && newStatus === 'topic'

  db.prepare(`
    UPDATE megatrends SET
      signals_count        = ?,
      sources_count        = ?,
      unique_sources_count = ?,
      regions_count        = ?,
      first_seen_at        = ?,
      last_seen_at         = ?,
      active_days          = ?,
      confirmation_status  = ?,
      topic_critic_verdict    = CASE WHEN ? THEN NULL ELSE topic_critic_verdict END,
      topic_critic_reason     = CASE WHEN ? THEN NULL ELSE topic_critic_reason END,
      topic_critic_checked_at = CASE WHEN ? THEN NULL ELSE topic_critic_checked_at END,
      updated_at           = datetime('now')
    WHERE id = ?
  `).run(
    signals.length,
    signals.length,           // sources_count = total signals (may include repeats)
    uniqueSources.size,
    Math.max(1, uniqueRegions.size),
    firstSeenAt,
    lastSeenAt,
    activeDays,
    newStatus,
    wasJustPromoted ? 1 : 0,  // CASE WHEN condition x3
    wasJustPromoted ? 1 : 0,
    wasJustPromoted ? 1 : 0,
    megatrendId,
  )
}

// ── Bulk recalculate all megatrends (for migration / rescore scripts) ─────────

export function recalculateAllMegatrendMetrics(): void {
  const db = getDb()
  const ids = db.prepare(`SELECT id FROM megatrends`).all() as Array<{ id: string }>
  for (const { id } of ids) {
    recalculateMegatrendMetrics(id)
  }
}

// ── Read signals for a megatrend ──────────────────────────────────────────────

export function getSignalsForMegatrend(megatrendId: string): MegatrendSignalRow[] {
  return getDb()
    .prepare(`SELECT * FROM megatrend_signals WHERE megatrend_id = ? ORDER BY published_at DESC`)
    .all(megatrendId) as MegatrendSignalRow[]
}
