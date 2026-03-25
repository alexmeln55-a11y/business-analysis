import crypto from 'crypto'
import { getDb } from '../db/client'
import { getTopicById } from '../extraction/config'
import type { CandidatePainRow } from '../types'

const RU_STOPWORDS = new Set([
  'и', 'в', 'не', 'на', 'с', 'что', 'как', 'это', 'так', 'по', 'но',
  'из', 'у', 'за', 'то', 'от', 'до', 'же', 'для', 'при', 'бы', 'если',
  'или', 'о', 'а', 'со', 'все', 'он', 'они', 'мы', 'вы', 'я', 'ты',
  'его', 'её', 'их', 'нет', 'да', 'уже', 'ещё', 'тут', 'там',
])

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[^а-яёa-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !RU_STOPWORDS.has(w))
  )
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = [...a].filter(x => b.has(x)).length
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : intersection / union
}

export function runClustering(): void {
  const db = getDb()

  const candidates = db.prepare(`
    SELECT * FROM candidate_pains
    WHERE extraction_status = 'accepted'
    ORDER BY topic_id, created_at
  `).all() as CandidatePainRow[]

  if (!candidates.length) {
    console.log('No accepted candidates to cluster')
    return
  }

  console.log(`Clustering ${candidates.length} candidates...`)

  // Group by topic
  const byTopic = new Map<string, CandidatePainRow[]>()
  for (const c of candidates) {
    if (!byTopic.has(c.topic_id)) byTopic.set(c.topic_id, [])
    byTopic.get(c.topic_id)!.push(c)
  }

  // Union-Find for clustering within each topic
  for (const [topicId, topicCandidates] of byTopic) {
    const topic = getTopicById(topicId)
    const vertical = topic?.vertical ?? topicId

    const tokens = topicCandidates.map(c => tokenize(c.pain + ' ' + (c.segment ?? '')))
    const parent: number[] = topicCandidates.map((_, i) => i)

    function find(i: number): number {
      while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i] }
      return i
    }

    function union(a: number, b: number) {
      parent[find(a)] = find(b)
    }

    // Merge similar candidates
    for (let i = 0; i < topicCandidates.length; i++) {
      for (let j = i + 1; j < topicCandidates.length; j++) {
        if (find(i) !== find(j) && jaccardSimilarity(tokens[i], tokens[j]) >= 0.35) {
          union(i, j)
        }
      }
    }

    // Build clusters
    const clusterMap = new Map<number, CandidatePainRow[]>()
    for (let i = 0; i < topicCandidates.length; i++) {
      const root = find(i)
      if (!clusterMap.has(root)) clusterMap.set(root, [])
      clusterMap.get(root)!.push(topicCandidates[i])
    }

    const upsertRegistry = db.prepare(`
      INSERT INTO pain_registry
        (pain_id, topic_id, vertical, segment, title, short_description,
         context, workaround, consequences, evidence_count,
         market_pain_score, source_types, last_seen_at, status,
         tags, score_breakdown, evidence_summary, updated_at)
      VALUES
        (@pain_id, @topic_id, @vertical, @segment, @title, @short_description,
         @context, @workaround, @consequences, @evidence_count,
         @market_pain_score, @source_types, @last_seen_at, @status,
         @tags, @score_breakdown, @evidence_summary, datetime('now'))
      ON CONFLICT(pain_id) DO UPDATE SET
        evidence_count    = excluded.evidence_count,
        market_pain_score = excluded.market_pain_score,
        last_seen_at      = excluded.last_seen_at,
        status            = excluded.status,
        evidence_summary  = excluded.evidence_summary,
        updated_at        = datetime('now')
    `)

    for (const [, cluster] of clusterMap) {
      if (cluster.length === 0) continue

      // Representative: highest confidence
      const rep = cluster.sort((a, b) => b.extraction_confidence - a.extraction_confidence)[0]
      const evidenceCount = cluster.length

      // Score: 3-10 range based on evidence count and confidence
      const avgConf = cluster.reduce((s, c) => s + c.extraction_confidence, 0) / cluster.length
      const rawScore = Math.min(10, 3 + evidenceCount * 0.4 + avgConf * 2)
      const score = Math.round(rawScore * 10) / 10

      const status = score >= 8 ? 'high_pain' : score >= 6 ? 'validated' : 'new'

      // Derive pain_id from topic + segment + pain hash
      const painKey = `${topicId}:${rep.segment ?? 'unknown'}:${rep.pain.slice(0, 60)}`
      const painId = crypto.createHash('sha256').update(painKey).digest('hex').slice(0, 16)

      const signalIds = cluster.map(c => c.signal_id)
      const lastDate = db.prepare(`
        SELECT MAX(date) as last FROM raw_signals WHERE signal_id IN (${signalIds.map(() => '?').join(',')})
      `).get(...signalIds) as { last: string } | undefined

      upsertRegistry.run({
        pain_id: painId,
        topic_id: topicId,
        vertical,
        segment: rep.segment ?? 'Не определено',
        title: rep.pain.slice(0, 100),
        short_description: rep.pain.slice(0, 200),
        context: rep.context ?? null,
        workaround: rep.workaround ?? null,
        consequences: rep.consequence ?? null,
        evidence_count: evidenceCount,
        market_pain_score: score,
        source_types: JSON.stringify(['telegram']),
        last_seen_at: lastDate?.last ?? new Date().toISOString(),
        status,
        tags: JSON.stringify([topicId]),
        score_breakdown: JSON.stringify({ evidence: evidenceCount, avg_confidence: avgConf }),
        evidence_summary: `${evidenceCount} сигналов из Telegram`,
      })
    }

    console.log(`  Topic ${topicId}: ${clusterMap.size} clusters`)
  }
}
