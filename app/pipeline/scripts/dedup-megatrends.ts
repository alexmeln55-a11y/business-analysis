// dedup-megatrends.ts — Fix-Signal-Topic-01
//
// LLM-powered semantic deduplication of megatrend signals.
// Runs between extract and confirm.
//
// Problem: Jaccard on title words fails for LLM-generated titles —
// "Развитие мультиагентных систем" and "Эволюция AI-ассистентов" score 0.00.
// Semantic similarity requires LLM.
//
// Flow:
//   1. Load all signal/topic megatrends grouped by vertical
//   2. For each vertical batch (≤ BATCH_SIZE topics):
//      - Ask LLM which topics are about the same market shift
//      - Receive merge groups (arrays of row indexes)
//   3. For each merge group:
//      - Keep the record with the most signals (or oldest) as canonical
//      - Reassign all megatrend_signals from duplicates to canonical
//      - Archive duplicate megatrend records
//      - Recalculate metrics on canonical → triggers signal → topic promotion
//   4. Print summary
//
// Usage: npm run pipeline:dedup-megatrends
// Options:
//   --dry-run  Print groups without modifying DB

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import OpenAI from 'openai'
import { setupDb } from '../db/setup'
import { getDb } from '../db/client'
import { recalculateMegatrendMetrics, recalculateAllMegatrendMetrics } from '../megatrends/signals'
import { checkTopicPromotion } from '../megatrends/semantic-checker'
import type { MegatrendRow } from '../types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const BATCH_SIZE = 12   // topics per LLM call — keeps context small
const DELAY_MS   = 300  // ms between LLM calls

// ── Prompt ────────────────────────────────────────────────────────────────────

const DEDUP_PROMPT = `
Ты — аналитик рынка. Тебе дан список тем рыночных сдвигов из одной отрасли.
Найди группы тем, которые указывают на ОДИН И ТОТ ЖЕ широкий рыночный сдвиг.
Разные проявления одного сдвига — это всё равно один сдвиг.

Примеры одного сдвига:
- "рост киберугроз для госструктур" + "ужесточение требований к ИБ" + "угрозы взлома паролей"
  → всё это один сдвиг: "нарастание киберугроз и ужесточение ИБ"
- "развитие AI-агентов" + "эволюция AI-ассистентов" + "AI-first разработка"
  → один сдвиг: "AI-автоматизация разработки"

Правила:
- Объединяй темы, если они про один рыночный сдвиг (даже если разные углы)
- НЕ объединяй темы из принципиально разных областей
- Если тема уникальна — не включай её ни в какую группу

Верни ТОЛЬКО JSON без markdown:
{
  "groups": [
    [0, 2],
    [1, 4, 7]
  ]
}

Если дубликатов нет — верни { "groups": [] }
`.trim()

// ── LLM call ──────────────────────────────────────────────────────────────────

interface DedupResult {
  groups: number[][]
}

async function findDuplicateGroups(
  topics: Array<{ title: string; summary: string }>,
): Promise<DedupResult> {
  const list = topics
    .map((t, i) => `[${i}] ${t.title}: ${t.summary.slice(0, 120)}`)
    .join('\n')

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.05,
    max_tokens: 300,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: DEDUP_PROMPT },
      { role: 'user',   content: list },
    ],
  })

  const raw = JSON.parse(res.choices[0].message.content ?? '{}')
  const groups = (raw.groups ?? []) as number[][]

  // Validate: only keep groups with 2+ items and valid indexes
  const valid = groups.filter(
    g => Array.isArray(g) && g.length >= 2 && g.every(i => i >= 0 && i < topics.length),
  )

  return { groups: valid }
}

// ── Merge two megatrend records ───────────────────────────────────────────────

function mergeDuplicateIntoCanonical(canonicalId: string, duplicateId: string): void {
  const db = getDb()

  // Reassign all signals from duplicate to canonical
  db.prepare(`
    UPDATE megatrend_signals
    SET megatrend_id = ?
    WHERE megatrend_id = ?
  `).run(canonicalId, duplicateId)

  // Archive the duplicate
  db.prepare(`
    UPDATE megatrends
    SET status = 'archived_dup', updated_at = datetime('now')
    WHERE id = ?
  `).run(duplicateId)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args    = process.argv.slice(2)
  const dryRun  = args.includes('--dry-run')

  setupDb()
  const db = getDb()

  // Load all non-archived signal/topic megatrends
  const rows = db.prepare(`
    SELECT * FROM megatrends
    WHERE confirmation_status IN ('signal', 'topic')
    AND status NOT IN ('archived', 'archived_dup')
    ORDER BY vertical, signals_count DESC, created_at ASC
  `).all() as MegatrendRow[]

  if (!rows.length) {
    console.log('No signal/topic megatrends to dedup.')
    process.exit(0)
  }

  console.log(`=== Semantic dedup: ${rows.length} megatrends${dryRun ? ' [DRY RUN]' : ''} ===\n`)

  // Group by vertical
  const byVertical = new Map<string, MegatrendRow[]>()
  for (const row of rows) {
    const v = row.vertical || 'Прочее'
    if (!byVertical.has(v)) byVertical.set(v, [])
    byVertical.get(v)!.push(row)
  }

  let groupsFound  = 0   // counted regardless of dry-run
  let totalMerged  = 0   // only incremented on real run
  let totalArchived = 0
  let batchNum     = 0

  for (const [vertical, vertRows] of byVertical.entries()) {
    // Process in batches
    for (let offset = 0; offset < vertRows.length; offset += BATCH_SIZE) {
      const batch = vertRows.slice(offset, offset + BATCH_SIZE)
      batchNum++

      console.log(`[${vertical}] batch ${batchNum}: ${batch.length} topics`)

      let result: DedupResult
      try {
        result = await findDuplicateGroups(batch.map(r => ({
          title:   r.title,
          summary: r.summary,
        })))
      } catch (err) {
        console.error(`  ✗ LLM error: ${(err as Error).message}`)
        continue
      }

      if (!result.groups.length) {
        console.log('  → no duplicates found')
        continue
      }

      for (const group of result.groups) {
        // Pick canonical: the one with most signals (or first if tie)
        const canonical = group.reduce((best, idx) =>
          batch[idx].signals_count > batch[best].signals_count ? idx : best,
          group[0],
        )
        const canonicalRow  = batch[canonical]
        const duplicateIdxs = group.filter(i => i !== canonical)
        const duplicateRows = duplicateIdxs.map(i => batch[i])

        console.log(`  ✓ merge → ${canonicalRow.title.slice(0, 50)}`)
        console.log(`    absorbs: ${duplicateRows.map(r => '"' + r.title.slice(0, 40) + '"').join(', ')}`)

        groupsFound++

        if (!dryRun) {
          for (const dup of duplicateRows) {
            mergeDuplicateIntoCanonical(canonicalRow.id, dup.id)
            totalArchived++
          }
          recalculateMegatrendMetrics(canonicalRow.id)
          totalMerged++

          // Log actual result: what status did the canonical get and why
          const after = db.prepare(`
            SELECT confirmation_status, unique_sources_count, signals_count
            FROM megatrends WHERE id = ?
          `).get(canonicalRow.id) as
            { confirmation_status: string; unique_sources_count: number; signals_count: number } | undefined

          if (after) {
            const s = after.unique_sources_count
            const d = (after as unknown as { active_days: number }).active_days ?? 0
            const reason = s >= 3 && d >= 30
              ? `${s} sources × ${d}d → path A`
              : s >= 2 && d >= 7
                ? `${s} sources × ${d}d → path B (critic pending)`
                : `${s} source(s), ${d}d → still signal`
            console.log(`    → ${after.confirmation_status.toUpperCase().padEnd(8)} (${reason})`)
          }
        }
      }

      if (batchNum < [...byVertical.values()].flat().length / BATCH_SIZE) {
        await new Promise(r => setTimeout(r, DELAY_MS))
      }
    }
  }

  // After merges, recalculate ALL megatrends to apply updated confirmation rules.
  // This catches records that weren't part of any merge group but may qualify
  // for 'topic' via the signals_count >= 3 volume rule.
  if (!dryRun) {
    recalculateAllMegatrendMetrics()
  }

  // Pipeline-09: topic critic pass — soft gate for signal→topic promotion.
  // After numeric recalculation, check all topics that haven't passed the critic yet.
  // Topics that fail critic are downgraded back to 'signal'.
  if (!dryRun) {
    const uncheckedTopics = db.prepare(`
      SELECT * FROM megatrends
      WHERE confirmation_status = 'topic'
        AND topic_critic_verdict IS NULL
        AND status NOT IN ('archived', 'archived_dup')
      ORDER BY signals_count DESC
    `).all() as MegatrendRow[]

    if (uncheckedTopics.length) {
      console.log(`\n=== Topic critic pass: ${uncheckedTopics.length} topics ===\n`)

      const saveVerdict = db.prepare(`
        UPDATE megatrends SET
          confirmation_status     = ?,
          topic_critic_verdict    = ?,
          topic_critic_reason     = ?,
          topic_critic_checked_at = datetime('now'),
          updated_at              = datetime('now')
        WHERE id = ?
      `)

      for (const row of uncheckedTopics) {
        let result: Awaited<ReturnType<typeof checkTopicPromotion>>
        try {
          result = await checkTopicPromotion(
            row.title,
            row.summary,
            row.signals_count,
            row.unique_sources_count,
          )
        } catch (err) {
          console.error(`  [ERROR] ${row.id} — ${(err as Error).message}`)
          continue
        }

        const newStatus = result.verdict === 'approve' ? 'topic' : 'signal'
        const icon      = result.verdict === 'approve' ? '✓' : '✗'

        console.log(
          `  ${icon} ${row.title.slice(0, 55).padEnd(55)}` +
          `  [${row.signals_count}sig/${row.unique_sources_count}src]` +
          `\n    ${result.verdict === 'approve' ? '→ topic' : '→ signal'}: ${result.reason}`
        )

        saveVerdict.run(newStatus, result.verdict, result.reason, row.id)

        await new Promise(r => setTimeout(r, DELAY_MS))
      }
    }
  }

  // Always print status distribution so output is informative in both modes
  const stats = db.prepare(`
    SELECT confirmation_status, COUNT(*) as cnt
    FROM megatrends
    WHERE status NOT IN ('archived', 'archived_dup')
    GROUP BY confirmation_status
  `).all() as Array<{ confirmation_status: string; cnt: number }>

  if (dryRun) {
    console.log(`\n=== Dry run: ${groupsFound} merge groups found (DB not changed) ===`)
    console.log('\nCurrent status distribution (unchanged):')
  } else {
    console.log(`\n=== Done: ${totalMerged} groups merged, ${totalArchived} archived ===`)
    console.log('\nStatus distribution after dedup:')
  }
  for (const s of stats) {
    console.log(`  ${s.confirmation_status.padEnd(16)} ${s.cnt}`)
  }
  if (!dryRun) {
    const topicCount = stats.find(s => s.confirmation_status === 'topic')?.cnt ?? 0
    const signalCount = stats.find(s => s.confirmation_status === 'signal')?.cnt ?? 0
    console.log(`\n→ ${topicCount} topic(s) ready for confirm-megatrends`)
    console.log(`  ${signalCount} signal(s) still need more data (run ingest + extract again)`)
    if (totalMerged !== topicCount) {
      console.log(`  note: merged groups (${totalMerged}) ≠ topic count (${topicCount})`)
      console.log(`  reason: some merges landed on single-source clusters → volume rule applied`)
    }
  }

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
