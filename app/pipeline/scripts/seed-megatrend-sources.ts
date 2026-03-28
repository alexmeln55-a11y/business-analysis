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
  source_id:  string
  source_name: string
  source_type: 'webpage' | 'report' | 'rss'
  url:        string
  vertical:   string
  region:     string
  priority:   number
  fetchMode:  'full_page' | 'rss' | 'summary'
  is_active?: number   // default 1; set 0 for unstable/paywalled sources
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
  // ── Upgrade-01a: дополнительные глобальные источники ─────────────────────
  {
    source_id:   'venturebeat-rss',
    source_name: 'VentureBeat (RSS)',
    source_type: 'rss',
    url:         'https://venturebeat.com/feed/',
    vertical:    'IT',
    region:      'global',
    priority:    8,
    fetchMode:   'rss',
  },
  {
    source_id:   'wired-rss',
    source_name: 'Wired (RSS)',
    source_type: 'rss',
    url:         'https://www.wired.com/feed/rss',
    vertical:    'IT',
    region:      'global',
    priority:    7,
    fetchMode:   'rss',
  },
  {
    source_id:   'theverge-rss',
    source_name: 'The Verge (RSS)',
    source_type: 'rss',
    url:         'https://www.theverge.com/rss/index.xml',
    vertical:    'IT',
    region:      'global',
    priority:    7,
    fetchMode:   'rss',
  },
  {
    source_id:   'reuters-tech-rss',
    source_name: 'Reuters Technology (RSS)',
    source_type: 'rss',
    url:         'https://feeds.reuters.com/reuters/technologyNews',
    vertical:    'cross-vertical',
    region:      'global',
    priority:    9,
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

  // ── Sources-01: новые иностранные источники ───────────────────────────────
  {
    source_id:   'ars-technica-rss',
    source_name: 'Ars Technica (RSS)',
    source_type: 'rss',
    url:         'https://feeds.arstechnica.com/arstechnica/index',
    vertical:    'IT',
    region:      'global',
    priority:    8,
    fetchMode:   'rss',
  },
  {
    source_id:   'the-register-rss',
    source_name: 'The Register (RSS)',
    source_type: 'rss',
    url:         'https://www.theregister.com/headlines.atom',
    vertical:    'IT',
    region:      'global',
    priority:    7,
    fetchMode:   'rss',
  },
  {
    source_id:   'infoq-rss',
    source_name: 'InfoQ (RSS)',
    source_type: 'rss',
    url:         'https://feed.infoq.com/',
    vertical:    'IT',
    region:      'global',
    priority:    7,
    fetchMode:   'rss',
  },
  {
    source_id:   'sifted-rss',
    source_name: 'Sifted — European Tech & Startups (RSS)',
    source_type: 'rss',
    url:         'https://sifted.eu/feed/',
    vertical:    'cross-vertical',
    region:      'EU',
    priority:    8,
    fetchMode:   'rss',
  },
  {
    source_id:   'eu-startups-rss',
    source_name: 'EU-Startups (RSS)',
    source_type: 'rss',
    url:         'https://eu-startups.com/feed/',
    vertical:    'cross-vertical',
    region:      'EU',
    priority:    7,
    fetchMode:   'rss',
  },
  {
    source_id:   'restofworld-rss',
    source_name: 'Rest of World (RSS)',
    source_type: 'rss',
    url:         'https://restofworld.org/feed/full-rss/',
    vertical:    'cross-vertical',
    region:      'global',
    priority:    8,
    fetchMode:   'rss',
  },
  {
    source_id:   'finextra-rss',
    source_name: 'Finextra (RSS)',
    source_type: 'rss',
    url:         'https://www.finextra.com/rss/headlines.aspx',
    vertical:    'fintech',
    region:      'global',
    priority:    8,
    fetchMode:   'rss',
  },
  {
    source_id:   'cnbc-tech-rss',
    source_name: 'CNBC Technology (RSS)',
    source_type: 'rss',
    url:         'https://www.cnbc.com/id/19854910/device/rss/rss.html',
    vertical:    'cross-vertical',
    region:      'global',
    priority:    7,
    fetchMode:   'rss',
  },
  {
    source_id:   'fortune-rss',
    source_name: 'Fortune (RSS)',
    source_type: 'rss',
    url:         'https://fortune.com/feed/',
    vertical:    'cross-vertical',
    region:      'global',
    priority:    7,
    fetchMode:   'rss',
  },
  {
    // Forbes global RSS deprecated ~2024 — disabled until stable URL confirmed
    source_id:   'forbes-global-rss',
    source_name: 'Forbes (RSS)',
    source_type: 'rss',
    url:         'https://www.forbes.com/feeds/investing/',
    vertical:    'cross-vertical',
    region:      'global',
    priority:    6,
    fetchMode:   'rss',
    is_active:   0,
  },
  {
    source_id:   'fast-company-rss',
    source_name: 'Fast Company (RSS)',
    source_type: 'rss',
    url:         'https://www.fastcompany.com/feed',
    vertical:    'cross-vertical',
    region:      'global',
    priority:    7,
    fetchMode:   'rss',
  },
  {
    source_id:   'semafor-rss',
    source_name: 'Semafor (RSS)',
    source_type: 'rss',
    url:         'https://www.semafor.com/rss',
    vertical:    'cross-vertical',
    region:      'global',
    priority:    7,
    fetchMode:   'rss',
  },
  {
    source_id:   'siliconangle-rss',
    source_name: 'SiliconANGLE (RSS)',
    source_type: 'rss',
    url:         'https://siliconangle.com/feed/',
    vertical:    'IT',
    region:      'global',
    priority:    7,
    fetchMode:   'rss',
  },
  {
    source_id:   'crunchbase-news-rss',
    source_name: 'Crunchbase News (RSS)',
    source_type: 'rss',
    url:         'https://news.crunchbase.com/feed/',
    vertical:    'cross-vertical',
    region:      'global',
    priority:    8,
    fetchMode:   'rss',
  },
  {
    source_id:   'ieee-spectrum-rss',
    source_name: 'IEEE Spectrum (RSS)',
    source_type: 'rss',
    url:         'https://spectrum.ieee.org/feeds/feed.rss',
    vertical:    'IT',
    region:      'global',
    priority:    7,
    fetchMode:   'rss',
  },

  // ── Sources-01: новые российские источники ────────────────────────────────
  {
    source_id:   'rbc-ru-rss',
    source_name: 'РБК — Новости (RSS)',
    source_type: 'rss',
    url:         'https://rssexport.rbc.ru/rbcnews/news/20/full.rss',
    vertical:    'cross-vertical',
    region:      'RU',
    priority:    9,
    fetchMode:   'rss',
  },
  {
    source_id:   'kommersant-rss',
    source_name: 'Коммерсантъ — Главное (RSS)',
    source_type: 'rss',
    url:         'https://www.kommersant.ru/RSS/main.xml',
    vertical:    'cross-vertical',
    region:      'RU',
    priority:    9,
    fetchMode:   'rss',
  },
  {
    // Ведомости: полные тексты за paywall, RSS отдаёт только заголовки и лиды
    source_id:   'vedomosti-rss',
    source_name: 'Ведомости — Главное (RSS)',
    source_type: 'rss',
    url:         'https://www.vedomosti.ru/rss/articles.xml',
    vertical:    'cross-vertical',
    region:      'RU',
    priority:    8,
    fetchMode:   'rss',
  },
  {
    source_id:   'rusbase-rss',
    source_name: 'Rusbase (RSS)',
    source_type: 'rss',
    url:         'https://rb.ru/feed/',
    vertical:    'cross-vertical',
    region:      'RU',
    priority:    8,
    fetchMode:   'rss',
  },
  {
    source_id:   'forbes-russia-rss',
    source_name: 'Forbes Russia (RSS)',
    source_type: 'rss',
    url:         'https://www.forbes.ru/rss',
    vertical:    'cross-vertical',
    region:      'RU',
    priority:    9,
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
    VALUES (?, ?, ?, ?, ?)
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

    const result = insert.run(s.source_id, s.source_name, s.source_type, s.is_active ?? 1, config)
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
