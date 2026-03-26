// Calibrated scoring: LLM оценивает тренд по явным anchor-шкалам.
// Используется и при extraction (новые тренды), и при rescore (пересчёт существующих).

import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const SCORING_SYSTEM_PROMPT = `
Ты — аналитик мегатрендов. Оцени тренд по 6 критериям, используя ANCHOR-ШКАЛЫ.
Не придумывай числа. Выбери ближайший anchor и объясни почему (1–2 предложения).

=== ANCHOR-ШКАЛЫ (1–10) ===

structural_strength — насколько тренд структурный, а не конъюнктурный:
  2 — локальная узкая тема, не тянет на структурный сдвиг
  4 — заметный рыночный сдвиг в одной вертикали
  6 — устойчивый сдвиг, влияющий на несколько сегментов
  8 — сильный долгосрочный сдвиг на несколько индустрий
  10 — крупный системный мегатренд на десятилетие

demand_signal — рыночный спрос прямо сейчас:
  2 — спрос слабый, неясный или только прогнозируется
  4 — есть признаки интереса, но нестабильные
  6 — понятный растущий спрос с несколькими сигналами
  8 — сильный подтверждённый спрос, много участников рынка
  10 — массовый ажиотажный или очевидный спрос

longevity — горизонт и устойчивость тренда:
  2 — короткая волна, скорее всего пройдёт за год
  4 — может прожить 1–3 года, но неустойчиво
  6 — устойчивый тренд на 3–5 лет
  8 — долгосрочный сдвиг на 5–10 лет
  10 — фундаментальный сдвиг на 10+ лет

geographic_spread — охват: локальный vs глобальный:
  2 — виден только в одной локальной точке
  4 — заметен в одном рынке или регионе
  6 — подтверждается в нескольких регионах
  8 — заметен в большинстве развитых рынков
  10 — глобально синхронный тренд

clarity_of_need — чёткость и измеримость потребности:
  2 — непонятно, какую потребность это решает
  4 — потребность угадывается, но нечётко определена
  6 — потребность ясна и понятна целевой аудитории
  8 — потребность чётко сформулирована и измерима
  10 — потребность массовая, очевидная и уже оплачиваемая

hype_risk — риск хайпа и переоценки:
  2 — трезвый структурный тренд, минимум ажиотажа
  4 — небольшой медиашум, но есть реальная основа
  6 — заметная медиаактивность, риск переоценки умеренный
  8 — высокий хайп, реальность может не соответствовать ожиданиям
  10 — чистый хайп или инфошум без реальной основы

=== ФОРМАТ ОТВЕТА ===
Верни только JSON (без markdown):
{
  "structural_strength": <1–10>,
  "structural_strength_reason": "...",
  "demand_signal": <1–10>,
  "demand_signal_reason": "...",
  "longevity": <1–10>,
  "longevity_reason": "...",
  "geographic_spread": <1–10>,
  "geographic_spread_reason": "...",
  "clarity_of_need": <1–10>,
  "clarity_of_need_reason": "...",
  "hype_risk": <1–10>,
  "hype_risk_reason": "..."
}
`.trim()

export interface CalibratedScores {
  structural_strength: number
  structural_strength_reason: string
  demand_signal: number
  demand_signal_reason: string
  longevity: number
  longevity_reason: string
  geographic_spread: number
  geographic_spread_reason: string
  clarity_of_need: number
  clarity_of_need_reason: string
  hype_risk: number
  hype_risk_reason: string
}

/** Call LLM to score a megatrend with calibrated anchors. */
export async function getCalibatedScores(
  title: string,
  summary: string,
  why_growing: string | null,
): Promise<CalibratedScores> {
  const userContent = [
    `Тренд: ${title}`,
    `Суть: ${summary}`,
    why_growing ? `Почему растёт: ${why_growing}` : '',
  ].filter(Boolean).join('\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.05,
    max_tokens: 700,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SCORING_SYSTEM_PROMPT },
      { role: 'user',   content: userContent },
    ],
  })

  return JSON.parse(response.choices[0].message.content ?? '{}') as CalibratedScores
}
