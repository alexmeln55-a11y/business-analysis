// Server-only DB adapter for shifts (megatrends table) + business_ideas.
// Import ONLY from API routes or server components — never from client components.

import path from 'path'
import type { PainRegistryAdapter, PainListItem, PainDetailItem, PainStatus, BusinessIdea } from './pain-registry'

interface ShiftRow {
  id: string; title: string; summary: string
  why_growing: string | null; time_horizon: string | null; geography: string | null
  vertical: string; source_name: string | null
  structural_strength: number; demand_signal: number; longevity: number
  geographic_spread: number; total_score: number; status: string
  confirmation_status: string | null
  signals_count: number | null
  unique_sources_count: number | null
  regions_count: number | null
  first_seen_at: string | null
  last_seen_at: string | null
  active_days: number | null
  priority: string | null
  updated_at: string
}

interface IdeaRow {
  id: string; shift_id: string; title: string; summary: string
  target_user: string | null; problem: string | null
  why_now: string | null; simple_entry: string | null
  confidence: number; created_at: string
}

function rowToListItem(row: ShiftRow): PainListItem {
  return {
    pain_id:           row.id,
    title:             row.title,
    segment:           row.geography ?? '',
    short_description: row.summary,
    vertical:          row.vertical,
    market_pain_score: row.total_score,
    evidence_count:    row.unique_sources_count ?? (row.source_name ? row.source_name.split(',').length : 1),
    source_types:      row.source_name
      ? row.source_name.split(',').map(s => s.trim().toLowerCase().replace(/\s+/g, '_'))
      : [],
    last_seen_at: (row.last_seen_at ?? row.updated_at).slice(0, 10),
    status:       row.status as PainStatus,
    tags:         [row.vertical, row.geography ?? '', row.time_horizon ?? ''].filter(Boolean),
    confirmation_status: normaliseConfirmationStatus(row.confirmation_status),
    priority:            (row.priority ?? 'medium') as PainListItem['priority'],
    signals_count:       row.signals_count ?? 1,
    unique_sources_count: row.unique_sources_count ?? 1,
    regions_count:       row.regions_count ?? 1,
    first_seen_at:       row.first_seen_at ?? row.updated_at,
    active_days:         row.active_days ?? 1,
    why_growing:         row.why_growing ?? undefined,
  }
}

// Rules-01: three active statuses — signal | topic | confirmed_shift.
// Legacy values ('confirmed', 'candidate') are remapped here as a safety net
// until the recalculate-statuses script cleans the DB.
function normaliseConfirmationStatus(raw: string | null): PainListItem['confirmation_status'] {
  if (raw === 'confirmed_shift' || raw === 'confirmed') return 'confirmed_shift'
  if (raw === 'topic' || raw === 'candidate') return 'topic'
  return 'signal'
}

function rowToDetailItem(row: ShiftRow, ideas: BusinessIdea[]): PainDetailItem {
  return {
    ...rowToListItem(row),
    full_description: row.why_growing ?? row.summary,
    target_who:       [row.time_horizon, row.geography].filter(Boolean).join(' · '),
    context:          row.summary,
    workaround:       '',
    consequences:     '',
    score_breakdown: {
      structural_strength: row.structural_strength,
      demand_signal:       row.demand_signal,
      longevity:           row.longevity,
      geographic_spread:   row.geographic_spread,
    },
    evidence_summary: row.source_name
      ? `Источники: ${row.source_name}.`
      : 'Данные из открытых источников.',
    ideas,
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
          CASE confirmation_status
            WHEN 'confirmed_shift' THEN 0
            WHEN 'topic'           THEN 1
            ELSE 2
          END ASC,
          CASE priority
            WHEN 'high'   THEN 0
            WHEN 'medium' THEN 1
            ELSE 2
          END ASC,
          total_score DESC
      `).all() as ShiftRow[]
      return rows.map(rowToListItem)
    },

    async getPainDetail(id: string) {
      const row = db.prepare(`SELECT * FROM megatrends WHERE id = ?`).get(id) as ShiftRow | undefined
      if (!row) return null

      // Load business ideas for this shift
      let ideas: BusinessIdea[] = []
      try {
        const ideaRows = db.prepare(
          `SELECT * FROM business_ideas WHERE shift_id = ? ORDER BY created_at ASC`
        ).all(id) as IdeaRow[]
        ideas = ideaRows.map(r => ({
          id:           r.id,
          title:        r.title,
          summary:      r.summary,
          target_user:  r.target_user ?? '',
          problem:      r.problem ?? '',
          why_now:      r.why_now ?? '',
          simple_entry: r.simple_entry ?? '',
          how_to_earn:  r.simple_entry ?? '',  // DB ideas: use simple_entry as fallback until column added
        }))
      } catch {
        // business_ideas table may not exist yet on older DBs — gracefully ignore
      }

      return rowToDetailItem(row, ideas)
    },

    async getPersonalMatches() {
      return []
    },
  }
}
