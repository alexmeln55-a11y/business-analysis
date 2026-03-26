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
  {
    source_id:   'wef-future-of-jobs-2025',
    source_name: 'WEF — Future of Jobs 2025',
    source_type: 'report',
    url:         'https://www.weforum.org/publications/the-future-of-jobs-report-2025/',
    vertical:    'cross-vertical',
    region:      'global',
    priority:    10,
    fetchMode:   'full_page',
  },
  {
    source_id:   'oecd-strategic-foresight',
    source_name: 'OECD — Strategic Foresight',
    source_type: 'webpage',
    url:         'https://www.oecd.org/en/topics/sub-issues/strategic-foresight.html',
    vertical:    'cross-vertical',
    region:      'global',
    priority:    9,
    fetchMode:   'full_page',
  },
  {
    source_id:   'oecd-global-scenarios-2035',
    source_name: 'OECD — Global Scenarios to 2035',
    source_type: 'report',
    url:         'https://www.oecd.org/en/publications/global-scenarios-for-the-next-decade_e7c99f1a-en.html',
    vertical:    'cross-vertical',
    region:      'global',
    priority:    9,
    fetchMode:   'full_page',
  },
  {
    source_id:   'mckinsey-tech-trends-2025',
    source_name: 'McKinsey — Technology Trends 2025',
    source_type: 'webpage',
    url:         'https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-top-trends-in-tech',
    vertical:    'IT',
    region:      'global',
    priority:    10,
    fetchMode:   'full_page',
  },
  {
    source_id:   'google-trends-signal-ru',
    source_name: 'Google Trends — Trending Russia (RSS)',
    source_type: 'rss',
    url:         'https://trends.google.com/trends/trendingsearches/daily/rss?geo=RU',
    vertical:    'cross-vertical',
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
