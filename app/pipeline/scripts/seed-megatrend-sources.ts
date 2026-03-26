// Seed starter megatrend sources into the sources table.
// Run: npm run pipeline:seed-megatrend-sources
// Safe to re-run: skips existing sources by source_id.

import 'dotenv/config'
import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { getDb } from '../db/client'
import { ALL_SCHEMAS } from '../db/schema'

interface SourceSeed {
  source_id: string
  source_name: string
  source_type: 'webpage' | 'report' | 'rss'
  url: string
  vertical: string
  region: string
  priority: number
  fetchMode: 'full_page' | 'rss' | 'summary'
}

const SEEDS: SourceSeed[] = [
  // ── Global tech & trends (RSS — публично доступны) ───────────────────────
  {
    source_id:   'wef-agenda-rss',
    source_name: 'WEF Agenda — Future of Work & Tech (RSS)',
    source_type: 'rss',
    url:         'https://www.weforum.org/agenda/feed/',
    vertical:    'cross-vertical',
    region:      'global',
    priority:    10,
    fetchMode:   'rss',
  },
  {
    source_id:   'mit-tech-review-rss',
    source_name: 'MIT Technology Review (RSS)',
    source_type: 'rss',
    url:         'https://www.technologyreview.com/feed/',
    vertical:    'IT',
    region:      'global',
    priority:    9,
    fetchMode:   'rss',
  },
  {
    source_id:   'techcrunch-rss',
    source_name: 'TechCrunch (RSS)',
    source_type: 'rss',
    url:         'https://techcrunch.com/feed/',
    vertical:    'IT',
    region:      'global',
    priority:    8,
    fetchMode:   'rss',
  },
  // ── Российские источники (RSS) ────────────────────────────────────────────
  {
    source_id:   'vc-ru-rss',
    source_name: 'VC.ru — Технологии и бизнес (RSS)',
    source_type: 'rss',
    url:         'https://vc.ru/rss',
    vertical:    'cross-vertical',
    region:      'RU',
    priority:    9,
    fetchMode:   'rss',
  },
  {
    source_id:   'habr-ru-rss',
    source_name: 'Habr — IT и технологии (RSS)',
    source_type: 'rss',
    url:         'https://habr.com/ru/rss/all/all/?fl=ru',
    vertical:    'IT',
    region:      'RU',
    priority:    8,
    fetchMode:   'rss',
  },
]

function main() {
  const db = getDb()

  // Ensure schema exists
  for (const sql of ALL_SCHEMAS) {
    db.prepare(sql).run()
  }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO sources (source_id, source_name, source_type, is_active, config)
    VALUES (?, ?, ?, 1, ?)
  `)

  let inserted = 0
  let skipped  = 0

  for (const s of SEEDS) {
    const config = JSON.stringify({
      url:       s.url,
      vertical:  s.vertical,
      region:    s.region,
      priority:  s.priority,
      fetchMode: s.fetchMode,
    })

    const result = insert.run(s.source_id, s.source_name, s.source_type, config)
    if (result.changes > 0) {
      inserted++
      console.log(`  ✓ ${s.source_name}`)
    } else {
      skipped++
      console.log(`  — skipped (exists): ${s.source_name}`)
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`)
}

main()
