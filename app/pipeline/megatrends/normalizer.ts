// Megatrend normalizer — deduplicates and merges similar megatrends.
// Uses canonical_key (lowercased topic slug) to detect duplicates.
// Does NOT require LLM — purely deterministic.

import { getDb } from '../db/client'
import type { MegatrendRow } from '../types'

/** Normalize title to canonical key for dedup */
export function toCanonicalKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[ёе]/g, 'е')
    .replace(/[^а-яa-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

/** Jaccard similarity on word sets */
function jaccard(a: string, b: string): number {
  const setA = new Set(a.split('_'))
  const setB = new Set(b.split('_'))
  const intersection = [...setA].filter(w => setB.has(w)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

/** Find existing megatrend with similar canonical_key (Jaccard > 0.5) */
export function findDuplicate(canonicalKey: string): MegatrendRow | null {
  const db = getDb()
  const rows = db.prepare(`SELECT * FROM megatrends WHERE status != 'archived'`).all() as MegatrendRow[]
  for (const row of rows) {
    const existing = row.canonical_key ?? toCanonicalKey(row.title)
    if (jaccard(canonicalKey, existing) > 0.5) return row
  }
  return null
}

/**
 * Merge an incoming megatrend into an existing one.
 * Keeps the existing record but updates evidence fields.
 */
export function mergeIntoExisting(existingId: string, incomingSourceName: string): void {
  const db = getDb()
  db.prepare(`
    UPDATE megatrends
    SET source_name = COALESCE(source_name, '') || ', ' || ?,
        updated_at  = datetime('now')
    WHERE id = ?
  `).run(incomingSourceName, existingId)
}

/** Run dedup pass over all pending megatrends */
export function runNormalization(): { merged: number; kept: number } {
  const db = getDb()
  const rows = db.prepare(`SELECT * FROM megatrends ORDER BY created_at ASC`).all() as MegatrendRow[]
  let merged = 0
  let kept = 0

  const seen = new Map<string, string>() // canonicalKey → id

  for (const row of rows) {
    const key = row.canonical_key ?? toCanonicalKey(row.title)
    let foundDup = false
    for (const [seenKey, seenId] of seen.entries()) {
      if (seenId !== row.id && jaccard(key, seenKey) > 0.5) {
        // Merge: archive the newer one, update source list on older
        mergeIntoExisting(seenId, row.source_name ?? '')
        db.prepare(`UPDATE megatrends SET status = 'archived' WHERE id = ?`).run(row.id)
        merged++
        foundDup = true
        break
      }
    }
    if (!foundDup) {
      seen.set(key, row.id)
      kept++
    }
  }

  return { merged, kept }
}
