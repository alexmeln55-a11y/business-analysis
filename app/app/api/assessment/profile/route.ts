import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { FounderProfile } from '@/lib/assessment'

// ── AI synthesis output type ───────────────────────────────────

export interface AISynthesis {
  paragraph1: string  // кто + реальная сила
  paragraph2: string  // главное ограничение
  paragraph3: string  // территория / подходящие возможности
  paragraph4: string  // куда не стоит идти
}

// ── OpenAI client ──────────────────────────────────────────────

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Convert rule-based profile to prompt data ──────────────────
// Sources stripped from AI-visible text to prevent block terminology in output.
// Sources are kept in FounderProfile for server-side validation only.

function profileToText(p: FounderProfile): string {
  const lines: string[] = [
    `Блоков диагностики заполнено: ${p.completedBlocks} из 6`,
    `Подтверждена слабая идеация: ${p.weakIdeation ? 'ДА — обязательно отразить в ограничениях и нежелательных сценариях' : 'нет'}`,
    '',
    'ТИП И СТИЛЬ ОСНОВАТЕЛЯ:',
    ...(p.coreProfile.length > 0
      ? p.coreProfile.map(s => `  · ${s}`)
      : ['  · (данных недостаточно)']),
    '',
    `ПОДТВЕРЖДЁННЫЕ СИЛЬНЫЕ СТОРОНЫ (${p.strengths.length}):`,
    ...(p.strengths.length > 0
      ? p.strengths.map(f => `  · ${f.text}`)
      : ['  · (нет подтверждённых данными)']),
    '',
    `ЗАФИКСИРОВАННЫЕ ОГРАНИЧЕНИЯ (${p.limitations.length}) — все обязательны к отражению:`,
    ...(p.limitations.length > 0
      ? p.limitations.map(f => `  · ${f.text}`)
      : ['  · (нет выраженных)']),
    '',
    `СТИЛЬ ЗАПУСКА (${p.launchStyle.length}):`,
    ...p.launchStyle.map(f => `  · ${f.text}`),
    '',
    `ПОДХОДЯЩИЕ ТИПЫ ВОЗМОЖНОСТЕЙ (${p.opportunityTypes.length}):`,
    ...(p.opportunityTypes.length > 0
      ? p.opportunityTypes.map(f => `  · ${f.text}`)
      : ['  · (данных недостаточно)']),
    '',
    `НЕЖЕЛАТЕЛЬНЫЕ СЦЕНАРИИ (${p.warningScenarios.length}) — все обязательны к отражению:`,
    ...(p.warningScenarios.length > 0
      ? p.warningScenarios.map(f => `  · ${f.text}`)
      : ['  · (нет явных)']),
  ]
  return lines.join('\n')
}

// ── System prompt ──────────────────────────────────────────────

const SYSTEM_PROMPT = `Ты получаешь структурированные данные диагностики основателя.
Напиши ОДИН текст из четырёх абзацев — без заголовков, без списков, без пунктов.

СТРУКТУРА (строго 4 абзаца в таком порядке):

Абзац 1 — кто этот человек и в чём его реальная сила
Абзац 2 — главное ограничение, честно и без смягчения
Абзац 3 — где его территория, какие возможности подходят
Абзац 4 — куда не стоит идти и почему

ПРАВИЛА:
- Пиши "ты", "твой", "тебе"
- Никаких терминов инструментов в тексте: не писать HEXACO, ESE, EntreComp,
  Schwartz, PVQ, Darwinian, Communitarian, Missionary, Б1, Б2, Б3, Б4, Б5, Б6
- Никаких списков, маркеров, пунктов внутри текста
- Каждый абзац — 2–4 строки, только связный текст
- Тон: спокойный и честный, без мотивации и без комплиментов
- Каждое утверждение опирается только на переданные данные
- Если данных на абзац не хватает — верни для него пустую строку ""
- Слабая идеация (если флаг ДА) — обязательно называть в абзаце 2 и в абзаце 4

САМОПРОВЕРКА ПЕРЕД ВЫВОДОМ:
- Нет ли терминов диагностики в тексте?
- Нет ли списков или маркеров?
- Названо ли главное ограничение прямо?
- Не смягчено ли оно косвенными формулировками?

ФОРМАТ ВЫВОДА (строгий JSON, без markdown):
{
  "paragraph1": "...",
  "paragraph2": "...",
  "paragraph3": "...",
  "paragraph4": "..."
}`

// ── Validate and fix AI output ─────────────────────────────────

const BLOCK_TERMS = /\b(HEXACO|ESE|EntreComp|Schwartz|PVQ|Darwinian|Communitarian|Missionary|Б[1-6])\b/gi
const cleanText = (s: string) => s.replace(BLOCK_TERMS, '').replace(/\s{2,}/g, ' ').trim()

function validateAndFix(raw: unknown, profile: FounderProfile): AISynthesis | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>

  const str = (key: string) =>
    typeof r[key] === 'string' ? cleanText((r[key] as string).trim()) : ''

  const synthesis: AISynthesis = {
    paragraph1: str('paragraph1'),
    paragraph2: str('paragraph2'),
    paragraph3: str('paragraph3'),
    paragraph4: str('paragraph4'),
  }

  // Minimum viability: at least paragraph1 must exist
  if (!synthesis.paragraph1) return null

  // RULE: weakIdeation must appear in paragraph2 and paragraph4
  if (profile.weakIdeation) {
    const ideationRx = /идеа|генер|идей|концепц|придумыва/i
    if (synthesis.paragraph2 && !ideationRx.test(synthesis.paragraph2)) {
      synthesis.paragraph2 =
        'Придумывать идеи с нуля — не твоё. Это подтверждено данными. ' +
        synthesis.paragraph2
    }
    if (synthesis.paragraph4 && !ideationRx.test(synthesis.paragraph4)) {
      synthesis.paragraph4 +=
        ' Не стоит идти туда, где нужно самостоятельно генерировать принципиально новые идеи — это не твой стиль.'
    }
  }

  return synthesis
}

// ── Handler ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const profile = body.profile as FounderProfile

    if (!profile || typeof profile.completedBlocks !== 'number') {
      return NextResponse.json({ error: 'Invalid profile data' }, { status: 400 })
    }

    if (profile.completedBlocks < 3) {
      return NextResponse.json(
        { error: 'Недостаточно данных — заполните минимум 3 блока' },
        { status: 400 }
      )
    }

    const profileText = profileToText(profile)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Данные профиля:\n\n${profileText}` },
      ],
      temperature: 0.25,
      max_tokens: 2000,
    })

    const raw = JSON.parse(response.choices[0].message.content ?? '{}')
    const synthesis = validateAndFix(raw, profile)

    if (!synthesis) {
      return NextResponse.json(
        { error: 'AI-ответ не прошёл валидацию — попробуйте ещё раз' },
        { status: 500 }
      )
    }

    return NextResponse.json({ synthesis })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
