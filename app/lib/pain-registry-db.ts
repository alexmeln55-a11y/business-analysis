// Server-only DB adapter for megatrends table.
// Import ONLY from API routes or server components — never from client components.
// better-sqlite3 is installed separately for pipeline scripts (not in package.json).

import path from 'path'
import type { PainRegistryAdapter, PainListItem, PainDetailItem, PainStatus } from './pain-registry'

interface MegatrendRow {
  id: string; title: string; summary: string
  why_growing: string | null; time_horizon: string | null; geography: string | null
  vertical: string; source_name: string | null
  structural_strength: number; demand_signal: number; longevity: number
  geographic_spread: number; total_score: number; status: string
  updated_at: string
}

function rowToListItem(row: MegatrendRow): PainListItem {
  return {
    pain_id: row.id,
    title: row.title,
    segment: row.geography ?? '',
    short_description: row.summary,
    vertical: row.vertical,
    market_pain_score: row.total_score,
    evidence_count: row.source_name ? row.source_name.split(',').length : 1,
    source_types: row.source_name
      ? row.source_name.split(',').map(s => s.trim().toLowerCase().replace(/\s+/g, '_'))
      : [],
    last_seen_at: row.updated_at.slice(0, 10),
    status: row.status as PainStatus,
    tags: [row.vertical, row.geography ?? '', row.time_horizon ?? ''].filter(Boolean),
  }
}

function rowToDetailItem(row: MegatrendRow): PainDetailItem {
  return {
    ...rowToListItem(row),
    full_description: row.summary,
    target_who: [row.time_horizon, row.geography].filter(Boolean).join(' · '),
    context: row.why_growing ?? '',
    workaround: '',
    consequences: '',
    score_breakdown: {
      structural_strength: row.structural_strength,
      demand_signal: row.demand_signal,
      longevity: row.longevity,
      geographic_spread: row.geographic_spread,
    },
    evidence_summary: row.source_name
      ? `Источники: ${row.source_name}.`
      : 'Данные из открытых источников.',
  }
}

export function createMegatrendDbAdapter(): PainRegistryAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const Database = require('better-sqlite3') as any
  const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), '..', 'data')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = new Database(path.join(DATA_DIR, 'opportunity.db'), { readonly: true })

  return {
    async listPains() {
      const rows = db.prepare(`
        SELECT * FROM megatrends
        WHERE status NOT IN ('archived', 'archived_dup')
        ORDER BY
          CASE status WHEN 'shortlist' THEN 0 WHEN 'watchlist' THEN 1 ELSE 2 END ASC,
          total_score DESC
      `).all() as MegatrendRow[]
      return rows.map(rowToListItem)
    },
    async getPainDetail(id: string) {
      const row = db.prepare(`SELECT * FROM megatrends WHERE id = ?`).get(id) as MegatrendRow | undefined
      return row ? rowToDetailItem(row) : null
    },
    async getPersonalMatches() {
      return []
    },
  }
}
