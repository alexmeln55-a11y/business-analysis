// idea-generator.ts — Shifts-01
//
// Generates 3–5 business ideas from a confirmed_shift topic.
// Each idea must directly follow from the shift — not be a generic fantasy.
// Ideas are saved to the business_ideas table.

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import OpenAI from 'openai'
import crypto from 'crypto'
import { getDb } from '../db/client'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const IDEA_PROMPT = `
Ты — product strategist. Тебе дают описание раннего рыночного сдвига.
Сгенерируй 3–5 конкретных бизнес-идей, которые ВЫТЕКАЮТ из этого сдвига.

Каждая идея должна:
- решать конкретную потребность, которую создаёт этот сдвиг
- иметь понятного целевого пользователя
- иметь простой первый шаг (MVP или пилот)
- объяснять, почему именно СЕЙЧАС это актуально

Не фантазируй в сторону. Каждая идея должна напрямую следовать из описанного сдвига.

Верни ТОЛЬКО JSON без markdown:
{
  "ideas": [
    {
      "title": "краткое название идеи",
      "summary": "1–2 предложения: суть продукта или сервиса",
      "target_user": "кто конкретно это купит",
      "problem": "какую конкретную боль решает",
      "why_now": "почему именно сейчас (связь со сдвигом)",
      "simple_entry": "простейший первый шаг: MVP, пилот, эксперимент"
    }
  ]
}
`.trim()

interface RawIdea {
  title: string
  summary: string
  target_user: string
  problem: string
  why_now: string
  simple_entry: string
}

export interface GeneratedIdea {
  id: string
  shift_id: string
  title: string
  summary: string
  target_user: string
  problem: string
  why_now: string
  simple_entry: string
  confidence: number
}

export async function generateIdeasForShift(
  shiftId: string,
  title: string,
  summary: string,
  whyGrowing: string | null,
): Promise<GeneratedIdea[]> {
  const context = [
    `Сдвиг: ${title}`,
    `Суть: ${summary}`,
    whyGrowing ? `Почему растёт: ${whyGrowing}` : '',
  ].filter(Boolean).join('\n')

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.25,   // slightly higher for creative diversity
    max_tokens: 1200,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: IDEA_PROMPT },
      { role: 'user',   content: context },
    ],
  })

  const parsed = JSON.parse(res.choices[0].message.content ?? '{}')
  const rawIdeas = (parsed.ideas ?? []) as RawIdea[]

  const ideas: GeneratedIdea[] = rawIdeas.slice(0, 5).map(raw => ({
    id:           `idea_${crypto.randomBytes(6).toString('hex')}`,
    shift_id:     shiftId,
    title:        raw.title ?? '',
    summary:      raw.summary ?? '',
    target_user:  raw.target_user ?? '',
    problem:      raw.problem ?? '',
    why_now:      raw.why_now ?? '',
    simple_entry: raw.simple_entry ?? '',
    confidence:   0.7,
  }))

  return ideas
}

export function saveIdeas(ideas: GeneratedIdea[]): void {
  const db = getDb()
  const insert = db.prepare(`
    INSERT OR IGNORE INTO business_ideas
      (id, shift_id, title, summary, target_user, problem, why_now, simple_entry, confidence)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertMany = db.transaction((items: GeneratedIdea[]) => {
    for (const idea of items) {
      insert.run(
        idea.id, idea.shift_id, idea.title, idea.summary,
        idea.target_user, idea.problem, idea.why_now, idea.simple_entry, idea.confidence,
      )
    }
  })
  insertMany(ideas)
}

export function deleteIdeasForShift(shiftId: string): void {
  getDb().prepare(`DELETE FROM business_ideas WHERE shift_id = ?`).run(shiftId)
}
