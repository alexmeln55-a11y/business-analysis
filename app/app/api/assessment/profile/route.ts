import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { FounderProfile } from '@/lib/assessment'

// ── AI synthesis output type ───────────────────────────────────

export interface AISynthesis {
  coreProfile: string
  strengths: string[]
  launchStyle: string
  limitations: string[]
  opportunityTypes: string[]
  warningScenarios: string[]
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
Пиши анализ на основе ТОЛЬКО этих данных.

ЖЁСТКИЕ ПРАВИЛА:

1. ТОЛЬКО ДАННЫЕ
- Используй исключительно то, что передано в input
- Если показатель не передан — не упоминай эту тему
- Не додумывай. Не предполагай. Не дополняй из общих знаний
- Если данных по разделу недостаточно: напиши "По этому разделу данных недостаточно"

2. ЗАПРЕЩЕНО
- Писать сильную сторону без подтверждения данными
- Сглаживать или смягчать низкие показатели и ограничения
- Использовать мотивационные фразы и комплименты
- Использовать термины диагностических инструментов:
  не писать HEXACO, ESE, EntreComp, Schwartz, Darwinian,
  Communitarian, Missionary, PVQ, Б1, Б2, Б3, Б4, Б5, Б6
- Писать "ты можешь" или "у тебя есть потенциал" —
  если это прямо не следует из переданных данных
- Добавлять сильные стороны сверх списка «ПОДТВЕРЖДЁННЫЕ СИЛЬНЫЕ СТОРОНЫ»
- Убирать или смягчать пункты из «ЗАФИКСИРОВАННЫЕ ОГРАНИЧЕНИЯ»

3. ТОН
- Пиши от второго лица: "ты", "твой", "тебе"
- Честный и спокойный — без комплиментов и без осуждения
- Каждую характеристику переводи в жизненный смысл
- Длина каждой секции: 3–5 строк, только текст

4. СТРУКТУРА — строго в этом порядке:
- coreProfile: кто этот основатель, как он действует
- strengths: что подтверждено данными
- launchStyle: как лучше всего заходить в новое
- limitations: все ограничения честно
- opportunityTypes: что подходит по профилю
- warningScenarios: что противопоказано

5. САМОПРОВЕРКА ПЕРЕД ВЫВОДОМ
Для каждого написанного тезиса проверь:
- Есть ли в input данные, которые это подтверждают?
- Если нет — удали тезис
- Низкий показатель → только в ограничениях, не в сильных сторонах
- Слабая идеация (если ДА) → обязана быть и в limitations, и в warningScenarios

ФОРМАТ ВЫВОДА (строгий JSON, без markdown):
{
  "coreProfile": "текст 3–5 строк",
  "strengths": ["тезис", "тезис", ...до 5 пунктов],
  "launchStyle": "текст 3–5 строк",
  "limitations": ["ограничение", ...все из списка],
  "opportunityTypes": ["тип", ...до 4 пунктов],
  "warningScenarios": ["сценарий", ...все из списка]
}`

// ── Validate and fix AI output ─────────────────────────────────

function validateAndFix(raw: unknown, profile: FounderProfile): AISynthesis | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>

  const synthesis: AISynthesis = {
    coreProfile: typeof r.coreProfile === 'string' ? r.coreProfile.trim() : '',
    strengths: Array.isArray(r.strengths)
      ? r.strengths.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : [],
    launchStyle: typeof r.launchStyle === 'string' ? r.launchStyle.trim() : '',
    limitations: Array.isArray(r.limitations)
      ? r.limitations.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : [],
    opportunityTypes: Array.isArray(r.opportunityTypes)
      ? r.opportunityTypes.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : [],
    warningScenarios: Array.isArray(r.warningScenarios)
      ? r.warningScenarios.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : [],
  }

  // Minimum viability
  if (!synthesis.coreProfile) return null

  // RULE: strengths cannot exceed rule-based count (AI cannot add invented ones)
  if (synthesis.strengths.length > profile.strengths.length + 1) {
    synthesis.strengths = synthesis.strengths.slice(0, profile.strengths.length + 1)
  }

  // RULE: limitations cannot be fewer than rule-based (AI cannot drop them)
  // If AI dropped limitations, append the missing rule-based ones
  if (profile.limitations.length > 0 && synthesis.limitations.length < profile.limitations.length) {
    const missing = profile.limitations.slice(synthesis.limitations.length)
    synthesis.limitations = [...synthesis.limitations, ...missing.map(f => f.text)]
  }

  // RULE: weakIdeation must appear in warningScenarios
  if (profile.weakIdeation) {
    const hasIdeationWarn = synthesis.warningScenarios.some(s =>
      /идеа|генер|идей|концепц|оригинал/i.test(s)
    )
    if (!hasIdeationWarn) {
      synthesis.warningScenarios.unshift(
        'Запуск без готовой концепции с расчётом на самостоятельный поиск идеи — твоя способность генерировать принципиально новые идеи с нуля слабая, это подтверждено данными'
      )
    }
    const hasIdeationLim = synthesis.limitations.some(s =>
      /идеа|генер|идей/i.test(s)
    )
    if (!hasIdeationLim) {
      synthesis.limitations.push(
        'Самостоятельная генерация новых идей с нуля затруднена — данные диагностики это подтверждают'
      )
    }
  }

  // RULE: filter out block terminology that leaked into output
  const blockTerms = /\b(HEXACO|ESE|EntreComp|Schwartz|PVQ|Darwinian|Communitarian|Missionary|Б[1-6])\b/gi
  const clean = (s: string) => s.replace(blockTerms, '').replace(/\s{2,}/g, ' ').trim()

  synthesis.coreProfile = clean(synthesis.coreProfile)
  synthesis.launchStyle = clean(synthesis.launchStyle)
  synthesis.strengths = synthesis.strengths.map(clean).filter(Boolean)
  synthesis.limitations = synthesis.limitations.map(clean).filter(Boolean)
  synthesis.opportunityTypes = synthesis.opportunityTypes.map(clean).filter(Boolean)
  synthesis.warningScenarios = synthesis.warningScenarios.map(clean).filter(Boolean)

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
