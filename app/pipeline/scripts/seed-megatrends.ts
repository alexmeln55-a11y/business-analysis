// Seed megatrends — inserts 10 hand-curated megatrends for the Russian market.
// Run once: npm run pipeline:seed-megatrends
// Safe to re-run: skips records that already exist (by id).

import 'dotenv/config'
import { getDb } from '../db/client'
import { ALL_SCHEMAS } from '../db/schema'
import { toCanonicalKey } from '../megatrends/normalizer'
import { scoreMegatrend } from '../megatrends/scorer'

interface SeedItem {
  id: string
  title: string
  summary: string
  why_growing: string
  time_horizon: string
  geography: string
  vertical: string
  source_name: string
  source_url: string
  structural_strength: number
  demand_signal: number
  longevity: number
  geographic_spread: number
  clarity_of_need: number
  hype_risk: number
  status: 'new' | 'validated' | 'high_pain'
}

const SEEDS: SeedItem[] = [
  {
    id: 'mt001',
    title: 'Импортозамещение корпоративного ПО',
    summary: 'Принудительная и добровольная миграция с зарубежного ПО на отечественный стек в госсекторе и крупном бизнесе.',
    why_growing: 'Санкции 2022–2024 отрезали РФ от Oracle, SAP, Microsoft 365, Adobe. Госсектор обязан перейти до 2025. Корпораты следуют за регулятором.',
    time_horizon: '2–4 года',
    geography: 'Россия',
    vertical: 'IT',
    source_name: 'Минцифры, CNews',
    source_url: 'https://digital.gov.ru',
    structural_strength: 9,
    demand_signal: 9,
    longevity: 8,
    geographic_spread: 3,
    clarity_of_need: 9,
    hype_risk: 4,
    status: 'high_pain',
  },
  {
    id: 'mt002',
    title: 'ИИ-автоматизация рутины малого бизнеса',
    summary: 'Малый и средний бизнес начинает использовать ИИ-инструменты для автоматизации переписки, документов, аналитики и клиентского сервиса.',
    why_growing: 'Стоимость LLM-API упала. ChatGPT и аналоги доступны. МСБ испытывает дефицит кадров и не может позволить штатных аналитиков.',
    time_horizon: '2–5 лет',
    geography: 'Россия + СНГ',
    vertical: 'IT',
    source_name: 'Skolkovo, RBC',
    source_url: '',
    structural_strength: 8,
    demand_signal: 8,
    longevity: 9,
    geographic_spread: 7,
    clarity_of_need: 7,
    hype_risk: 6,
    status: 'validated',
  },
  {
    id: 'mt003',
    title: 'Автоматизация налоговой отчётности ИП и МСБ',
    summary: 'Интеграция банковских сервисов, ФНС и бухгалтерских систем позволяет полностью автоматизировать отчётность для малого бизнеса.',
    why_growing: 'ФНС активно развивает API и ЕНП. Банки строят бухгалтерские сервисы. Клиентский запрос огромен — 3,7 млн ИП не хотят платить бухгалтеру.',
    time_horizon: '2–4 года',
    geography: 'Россия',
    vertical: 'Финансы',
    source_name: 'ФНС, Тинькофф Бизнес',
    source_url: 'https://nalog.ru',
    structural_strength: 9,
    demand_signal: 9,
    longevity: 7,
    geographic_spread: 3,
    clarity_of_need: 9,
    hype_risk: 2,
    status: 'high_pain',
  },
  {
    id: 'mt004',
    title: 'Кибербезопасность для малого и среднего бизнеса',
    summary: 'Рост числа атак на МСБ создаёт спрос на доступные решения по защите данных, удалённого доступа и антифрода.',
    why_growing: 'Атаки на МСБ выросли на 40% в 2023–2024. Работа с персональными данными требует соответствия 152-ФЗ. Страховые компании начинают требовать киберзащиту.',
    time_horizon: '1–3 года',
    geography: 'Россия',
    vertical: 'IT',
    source_name: 'Positive Technologies, ИСПДн',
    source_url: '',
    structural_strength: 8,
    demand_signal: 7,
    longevity: 8,
    geographic_spread: 5,
    clarity_of_need: 8,
    hype_risk: 3,
    status: 'validated',
  },
  {
    id: 'mt005',
    title: 'Маркетплейс-зависимость и диверсификация каналов МСБ',
    summary: 'Wildberries и Ozon монополизируют онлайн-ритейл. Продавцы ищут независимые каналы продаж и инструменты для снижения зависимости.',
    why_growing: 'WB поднял комиссии до 25–40%. Штрафная политика усилилась. Продавцы теряют маржу и ищут D2C-каналы, свои сайты и B2B-выходы.',
    time_horizon: '3–5 лет',
    geography: 'Россия',
    vertical: 'Ритейл',
    source_name: 'Data Insight, VC.ru',
    source_url: '',
    structural_strength: 7,
    demand_signal: 8,
    longevity: 7,
    geographic_spread: 3,
    clarity_of_need: 8,
    hype_risk: 3,
    status: 'validated',
  },
  {
    id: 'mt006',
    title: 'Цифровизация региональной логистики последней мили',
    summary: 'Рост e-com в регионах требует новой инфраструктуры доставки: ПВЗ, курьерские сети, маршрутизация в малых городах.',
    why_growing: 'E-com растёт в городах с населением 50–300 тыс. Маркетплейсы не успевают строить сети. Региональные логисты испытывают дефицит цифровых инструментов.',
    time_horizon: '3–5 лет',
    geography: 'Россия',
    vertical: 'Логистика',
    source_name: 'СДЭК, Data Insight',
    source_url: '',
    structural_strength: 7,
    demand_signal: 7,
    longevity: 7,
    geographic_spread: 4,
    clarity_of_need: 8,
    hype_risk: 2,
    status: 'validated',
  },
  {
    id: 'mt007',
    title: 'Онлайн-переквалификация и корпоративное обучение',
    summary: 'Дефицит кадров по IT, аналитике, управлению вынуждает компании и физлиц инвестировать в онлайн-обучение и переквалификацию.',
    why_growing: 'Рынок труда в IT перегрет: дефицит 500+ тыс. специалистов. Льготы на ДПО. Корпораты переходят на внутренние академии.',
    time_horizon: '3–7 лет',
    geography: 'Россия + СНГ',
    vertical: 'Образование',
    source_name: 'HeadHunter, Skillbox',
    source_url: '',
    structural_strength: 7,
    demand_signal: 7,
    longevity: 8,
    geographic_spread: 6,
    clarity_of_need: 7,
    hype_risk: 5,
    status: 'validated',
  },
  {
    id: 'mt008',
    title: 'Вертикальный SaaS для региональных отраслей',
    summary: 'Нишевые SaaS-решения для конкретных отраслей (строительство, медицина, агро, юридические услуги) вытесняют универсальные платформы.',
    why_growing: 'Уход западного SaaS открыл ниши. Региональные компании не хотят адаптироваться под общие инструменты. Спрос на отраслевую специфику высок.',
    time_horizon: '3–6 лет',
    geography: 'Россия',
    vertical: 'IT',
    source_name: 'VC.ru, РАЭК',
    source_url: '',
    structural_strength: 7,
    demand_signal: 6,
    longevity: 8,
    geographic_spread: 3,
    clarity_of_need: 7,
    hype_risk: 3,
    status: 'new',
  },
  {
    id: 'mt009',
    title: 'Превентивная медицина и персонализированное здоровье',
    summary: 'Спрос на ранее выявление рисков, чекапы, персонализированные программы здоровья растёт среди городского среднего класса.',
    why_growing: 'COVID изменил отношение к здоровью. Рост доходов в крупных городах. Очереди в государственных поликлиниках стимулируют переход в частную медицину.',
    time_horizon: '4–7 лет',
    geography: 'Россия (крупные города)',
    vertical: 'Здравоохранение',
    source_name: 'McKinsey Health, РБК',
    source_url: '',
    structural_strength: 7,
    demand_signal: 6,
    longevity: 9,
    geographic_spread: 5,
    clarity_of_need: 7,
    hype_risk: 4,
    status: 'new',
  },
  {
    id: 'mt010',
    title: 'HR-автоматизация и онбординг для малого бизнеса',
    summary: 'Текучка кадров и дефицит HR-ресурсов в МСБ создают спрос на автоматизированные системы найма, онбординга и удержания.',
    why_growing: 'Текучка в МСБ — 60–120% в год. HR-менеджеров нет. Платформы типа HeadHunter дорогие и сложные. Нужны простые инструменты.',
    time_horizon: '2–4 года',
    geography: 'Россия',
    vertical: 'HR',
    source_name: 'HeadHunter, SuperJob',
    source_url: '',
    structural_strength: 7,
    demand_signal: 7,
    longevity: 7,
    geographic_spread: 3,
    clarity_of_need: 8,
    hype_risk: 3,
    status: 'validated',
  },
]

function main() {
  const db = getDb()

  // Ensure schema exists
  for (const sql of ALL_SCHEMAS) {
    db.prepare(sql).run()
  }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO megatrends (
      id, title, summary, why_growing, time_horizon, geography, vertical,
      source_name, source_url,
      structural_strength, demand_signal, longevity, geographic_spread,
      clarity_of_need, hype_risk, total_score,
      status, canonical_key
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?
    )
  `)

  let inserted = 0
  let skipped = 0

  for (const s of SEEDS) {
    const totalScore = scoreMegatrend(s)
    const canonicalKey = toCanonicalKey(s.title)
    const result = insert.run(
      s.id, s.title, s.summary, s.why_growing, s.time_horizon, s.geography, s.vertical,
      s.source_name, s.source_url,
      s.structural_strength, s.demand_signal, s.longevity, s.geographic_spread,
      s.clarity_of_need, s.hype_risk, totalScore,
      s.status, canonicalKey,
    )
    if (result.changes > 0) { inserted++; console.log(`  ✓ ${s.title} (score ${totalScore})`) }
    else { skipped++; console.log(`  — skipped (already exists): ${s.title}`) }
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`)
}

main()
