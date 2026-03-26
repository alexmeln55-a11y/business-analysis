// ── UI Types (decoupled from raw backend/pipeline entities) ──────────────────

export type PainStatus = 'new' | 'validated' | 'high_pain' | 'archived' | 'shortlist' | 'watchlist' | 'archive'
export type FitLabel = 'high' | 'medium' | 'low'

/** Normalised item for list display (works for megatrends and pains) */
export interface PainListItem {
  pain_id: string
  title: string
  segment: string           // megatrends: geography/audience
  short_description: string
  vertical: string
  market_pain_score: number // megatrends: total_score
  evidence_count: number    // megatrends: source/signal count
  source_types: string[]    // megatrends: source names
  last_seen_at: string      // ISO date string
  status: PainStatus
  tags: string[]
}

/** Personal match item for right-column shortlist */
export interface PersonalPainMatchItem {
  pain_id: string
  title: string
  short_description: string
  fit_score: number         // 0–10
  fit_label: FitLabel
  fit_reason_short: string
  market_pain_score: number
  updated_at: string
}

/** Full detail item for drawer */
export interface PainDetailItem extends PainListItem {
  full_description: string  // megatrends: why_growing
  target_who: string        // megatrends: time_horizon + geography
  context: string           // megatrends: market context
  workaround: string        // megatrends: current solutions
  consequences: string      // megatrends: opportunities for founders
  score_breakdown: {
    structural_strength: number
    demand_signal: number
    longevity: number
    geographic_spread: number
  }
  evidence_summary: string
  personal_match?: {
    fit_label: FitLabel
    fit_reason_short: string
  }
}

// ── Mock megatrend data ───────────────────────────────────────────────────────

const MOCK_REGISTRY: PainDetailItem[] = [
  {
    pain_id: 'mt001',
    title: 'Импортозамещение корпоративного ПО',
    segment: 'Россия',
    short_description: 'Принудительная и добровольная миграция с зарубежного ПО на отечественный стек в госсекторе и корпоратах.',
    vertical: 'IT',
    market_pain_score: 9.1,
    evidence_count: 12,
    source_types: ['минцифры', 'cnews'],
    last_seen_at: '2026-03-20',
    status: 'high_pain',
    tags: ['импортозамещение', 'B2G', 'B2B', 'SaaS', 'госсектор'],
    full_description: 'Санкции 2022–2024 отрезали РФ от Oracle, SAP, Microsoft 365, Adobe. Госсектор обязан перейти до 2025. Корпораты следуют за регулятором — возникает огромный рынок для отечественных вендоров и интеграторов.',
    target_who: '2–4 года · Россия',
    context: 'Обязательный переход госсектора создаёт гарантированный спрос. Корпораты ищут решения с нейтральным риском. Объём рынка — 400+ млрд руб. ежегодно.',
    workaround: 'Частичная замена отдельных модулей, самописные решения, open-source (LibreOffice, PostgreSQL), 1С-экосистема.',
    consequences: 'Огромный B2G и B2B рынок для вертикальных SaaS, интеграторов, консультантов по миграции и обучению.',
    score_breakdown: { structural_strength: 9, demand_signal: 9, longevity: 8, geographic_spread: 3 },
    evidence_summary: 'Источники: Минцифры, CNews, официальные постановления. Обязательная замена до 2025 для ФОИВ.',
  },
  {
    pain_id: 'mt002',
    title: 'ИИ-автоматизация рутины малого бизнеса',
    segment: 'Россия + СНГ',
    short_description: 'Малый и средний бизнес начинает использовать ИИ-инструменты для автоматизации переписки, документов, аналитики.',
    vertical: 'IT',
    market_pain_score: 8.1,
    evidence_count: 8,
    source_types: ['skolkovo', 'rbc'],
    last_seen_at: '2026-03-22',
    status: 'validated',
    tags: ['ИИ', 'автоматизация', 'МСБ', 'LLM', 'продуктивность'],
    full_description: 'Стоимость LLM-API упала до минимума. ChatGPT и аналоги доступны. МСБ испытывает дефицит кадров и не может позволить штатных аналитиков — ИИ-инструменты становятся первым доступным способом масштабироваться без найма.',
    target_who: '2–5 лет · Россия + СНГ',
    context: 'В России 5,7 млн МСБ-субъектов. Большинство не имеет IT-отдела. Инструменты автоматизации на базе LLM стоят $10–50/мес — доступно.',
    workaround: 'Excel-макросы, фриланс на разовые задачи, дорогой штатный персонал, шаблонные CRM.',
    consequences: 'Рынок для агентных ИИ-инструментов, продуктов-ассистентов и отраслевых LLM-приложений для МСБ.',
    score_breakdown: { structural_strength: 8, demand_signal: 8, longevity: 9, geographic_spread: 7 },
    evidence_summary: 'Источники: Skolkovo AI-отчёт 2024, RBC Тренды. Глобальное подтверждение через Gartner Hype Cycle.',
  },
  {
    pain_id: 'mt003',
    title: 'Автоматизация налоговой отчётности ИП и МСБ',
    segment: 'Россия',
    short_description: 'Интеграция банков, ФНС и бухгалтерских систем позволяет полностью автоматизировать отчётность для малого бизнеса.',
    vertical: 'Финансы',
    market_pain_score: 9.3,
    evidence_count: 15,
    source_types: ['фнс', 'тинькофф'],
    last_seen_at: '2026-03-23',
    status: 'high_pain',
    tags: ['бухгалтерия', 'ИП', 'ЕНП', 'ФНС', 'автоматизация'],
    full_description: 'ФНС активно развивает API и ЕНП. Банки строят бухгалтерские сервисы. Клиентский запрос огромен — 3,7 млн ИП не хотят платить бухгалтеру 2–5 тыс./мес за то, что можно автоматизировать.',
    target_who: '2–4 года · Россия',
    context: '3,7 млн ИП в России. ФНС API позволяет автоматически подавать уведомления, декларации. Банки уже интегрируют первичный учёт.',
    workaround: 'Аутсорсинг бухгалтера, банковские сервисы с ограниченным функционалом, 1С Бухгалтерия.',
    consequences: 'Возможность создать end-to-end автоматизированный бухгалтерский продукт для 3,7 млн ИП.',
    score_breakdown: { structural_strength: 9, demand_signal: 9, longevity: 7, geographic_spread: 3 },
    evidence_summary: 'Источники: ФНС API-документация, Тинькофф Бизнес, Сбер Бизнес. Прямой регуляторный драйвер.',
  },
  {
    pain_id: 'mt004',
    title: 'Кибербезопасность для малого и среднего бизнеса',
    segment: 'Россия',
    short_description: 'Рост числа атак на МСБ создаёт спрос на доступные решения по защите данных, удалённого доступа и антифрода.',
    vertical: 'IT',
    market_pain_score: 8.2,
    evidence_count: 9,
    source_types: ['positive_tech', 'bi_zone'],
    last_seen_at: '2026-03-19',
    status: 'validated',
    tags: ['кибербезопасность', 'МСБ', '152-ФЗ', 'антифрод', 'утечки'],
    full_description: 'Атаки на МСБ выросли на 40% в 2023–2024. Работа с персональными данными требует соответствия 152-ФЗ. Страховые компании начинают требовать подтверждения кибергигиены для выдачи полисов.',
    target_who: '1–3 года · Россия',
    context: 'Малый бизнес — основная мишень для ransomware и фишинга: слабая защита, высокая готовность платить выкуп. Штрафы по 152-ФЗ ужесточились.',
    workaround: 'Антивирусы категории consumer, отсутствие политик безопасности, надежда на "нас не атакуют".',
    consequences: 'Рынок для доступных B2B security-продуктов: MDR, защита электронной почты, управление паролями, compliance-аудит.',
    score_breakdown: { structural_strength: 8, demand_signal: 7, longevity: 8, geographic_spread: 5 },
    evidence_summary: 'Источники: Positive Technologies, BI.ZONE, Kaspersky SMB Report 2024.',
  },
  {
    pain_id: 'mt005',
    title: 'Маркетплейс-зависимость и диверсификация каналов МСБ',
    segment: 'Россия',
    short_description: 'Wildberries и Ozon монополизируют онлайн-ритейл. Продавцы ищут независимые каналы и инструменты снижения зависимости.',
    vertical: 'Ритейл',
    market_pain_score: 7.9,
    evidence_count: 11,
    source_types: ['data_insight', 'vc_ru'],
    last_seen_at: '2026-03-21',
    status: 'validated',
    tags: ['маркетплейсы', 'D2C', 'WB', 'Ozon', 'диверсификация'],
    full_description: 'WB поднял комиссии до 25–40%. Штрафная политика усилилась. Продавцы теряют маржу и ищут D2C-каналы, собственные сайты и B2B-выходы. Зависимость от одного канала стала экзистенциальным риском.',
    target_who: '3–5 лет · Россия',
    context: 'WB и Ozon контролируют ~70% онлайн-ритейла в РФ. 600+ тыс. активных продавцов. Комиссии растут ежегодно.',
    workaround: 'Собственные сайты на Tilda/Shopify, социальные сети, офлайн-точки, B2B-каналы через посредников.',
    consequences: 'Возможности для D2C-платформ, инструментов мультиканального управления, аналитики маркетплейсов.',
    score_breakdown: { structural_strength: 7, demand_signal: 8, longevity: 7, geographic_spread: 3 },
    evidence_summary: 'Источники: Data Insight E-commerce 2024, VC.ru, официальные отчёты WB.',
  },
  {
    pain_id: 'mt006',
    title: 'Цифровизация региональной логистики последней мили',
    segment: 'Россия (регионы)',
    short_description: 'Рост e-com в регионах требует новой инфраструктуры: ПВЗ, курьерские сети, маршрутизация в малых городах.',
    vertical: 'Логистика',
    market_pain_score: 7.5,
    evidence_count: 8,
    source_types: ['сдэк', 'data_insight'],
    last_seen_at: '2026-03-18',
    status: 'validated',
    tags: ['логистика', 'e-com', 'регионы', 'ПВЗ', 'последняя миля'],
    full_description: 'E-com растёт в городах с населением 50–300 тыс. Маркетплейсы не успевают строить сети. Региональные логисты испытывают острый дефицит цифровых инструментов — маршрутизации, трекинга, управления ПВЗ.',
    target_who: '3–5 лет · Россия (регионы)',
    context: '1100+ городов с населением до 100 тыс. — e-com только входит. Текущая инфраструктура не справляется с ростом.',
    workaround: 'Почта России, региональные транспортные компании, разрозненные курьерские сервисы.',
    consequences: 'Рынок для регионального логистического SaaS, WMS-систем для малых складов, маршрутизаторов последней мили.',
    score_breakdown: { structural_strength: 7, demand_signal: 7, longevity: 7, geographic_spread: 4 },
    evidence_summary: 'Источники: СДЭК Аналитика 2024, Data Insight, НРА.',
  },
  {
    pain_id: 'mt007',
    title: 'Онлайн-переквалификация и корпоративное обучение',
    short_description: 'Дефицит IT-кадров и рост требований к квалификации вынуждают компании и физлиц инвестировать в онлайн-обучение.',
    segment: 'Россия + СНГ',
    vertical: 'Образование',
    market_pain_score: 7.3,
    evidence_count: 10,
    source_types: ['hh', 'skillbox'],
    last_seen_at: '2026-03-17',
    status: 'validated',
    tags: ['EdTech', 'переквалификация', 'IT-образование', 'корп-обучение', 'ДПО'],
    full_description: 'Рынок труда в IT перегрет: дефицит 500+ тыс. специалистов. Льготы на ДПО. Корпораты переходят на внутренние академии. Физлица ищут быстрые пути в новые профессии.',
    target_who: '3–7 лет · Россия + СНГ',
    context: 'Дефицит IT-специалистов официально признан критическим. Программы субсидированного обучения от государства. Корпоративный EdTech — новая строка в бюджетах.',
    workaround: 'Традиционное университетское образование, YouTube-курсы, индивидуальные менторы.',
    consequences: 'Возможности для вертикальных образовательных платформ, B2B-обучающих продуктов, AI-тьюторов.',
    score_breakdown: { structural_strength: 7, demand_signal: 7, longevity: 8, geographic_spread: 6 },
    evidence_summary: 'Источники: HeadHunter Рынок труда 2024, Skillbox Отчёт, МинПросвещения.',
  },
  {
    pain_id: 'mt008',
    title: 'Вертикальный SaaS для региональных отраслей',
    short_description: 'Нишевые SaaS-решения для конкретных отраслей вытесняют универсальные платформы после ухода западных вендоров.',
    segment: 'Россия',
    vertical: 'IT',
    market_pain_score: 7.0,
    evidence_count: 7,
    source_types: ['vc_ru', 'раэк'],
    last_seen_at: '2026-03-15',
    status: 'new',
    tags: ['SaaS', 'вертикальный рынок', 'B2B', 'регионы', 'импортозамещение'],
    full_description: 'Уход западного SaaS открыл ниши. Региональные компании не хотят адаптироваться под общие инструменты. Спрос на отраслевую специфику: строительство, медицина, агро, юридические услуги — огромен.',
    target_who: '3–6 лет · Россия',
    context: 'До 2022 западный SaaS занимал 60–70% корпоративного рынка. После ухода возникли сотни незакрытых ниш.',
    workaround: 'Самописные системы на 1С, Excel-таблицы, дорогой аутсорс разработки.',
    consequences: 'Стратегический рынок для нишевых SaaS-стартапов с отраслевой экспертизой.',
    score_breakdown: { structural_strength: 7, demand_signal: 6, longevity: 8, geographic_spread: 3 },
    evidence_summary: 'Источники: VC.ru, РАЭК Реестр российского ПО.',
  },
  {
    pain_id: 'mt009',
    title: 'Превентивная медицина и персонализированное здоровье',
    short_description: 'Спрос на чекапы, раннее выявление рисков и персонализированные программы здоровья растёт среди городского среднего класса.',
    segment: 'Россия (крупные города)',
    vertical: 'Здравоохранение',
    market_pain_score: 7.1,
    evidence_count: 6,
    source_types: ['mckinsey_health', 'rbc'],
    last_seen_at: '2026-03-14',
    status: 'new',
    tags: ['превентивная медицина', 'wellness', 'чекапы', 'персонализация', 'healthtech'],
    full_description: 'COVID изменил отношение к здоровью. Рост доходов в крупных городах. Очереди в государственных поликлиниках стимулируют переход в частную медицину и профилактику.',
    target_who: '4–7 лет · Россия (города 500k+)',
    context: 'Рынок частной медицины в РФ — 1,4 трлн руб. Аудитория платежеспособных пациентов, ориентированных на качество жизни.',
    workaround: 'Ежегодные медосмотры по ОМС, корпоративные ДМС-программы, самостоятельный подбор специалистов.',
    consequences: 'Рынок для digital-health приложений, сервисов мониторинга, персональных медицинских ассистентов.',
    score_breakdown: { structural_strength: 7, demand_signal: 6, longevity: 9, geographic_spread: 5 },
    evidence_summary: 'Источники: McKinsey Health Report 2024, РБК Здравоохранение, VADEMECUM.',
  },
  {
    pain_id: 'mt010',
    title: 'HR-автоматизация и онбординг для малого бизнеса',
    short_description: 'Текучка кадров и дефицит HR-ресурсов в МСБ создают спрос на автоматизированные системы найма и онбординга.',
    segment: 'Россия',
    vertical: 'HR',
    market_pain_score: 7.4,
    evidence_count: 8,
    source_types: ['hh', 'superjob'],
    last_seen_at: '2026-03-16',
    status: 'validated',
    tags: ['HR', 'онбординг', 'текучка', 'найм', 'автоматизация'],
    full_description: 'Текучка в МСБ — 60–120% в год. HR-менеджеров нет. Платформы типа HeadHunter дорогие и сложные для бизнеса без рекрутера. Онбординг каждого нового сотрудника занимает 2–3 недели ручной работы руководителя.',
    target_who: '2–4 года · Россия',
    context: '5,7 млн МСБ-субъектов в РФ. Большинство нанимает без систем — через мессенджеры и сарафан.',
    workaround: 'Авито Работа, ВКонтакте-группы, ручной онбординг через Google Docs, устный инструктаж.',
    consequences: 'Рынок для affordable HR-автоматизации: ATS, онбординг-конструкторы, чат-боты для рекрутинга.',
    score_breakdown: { structural_strength: 7, demand_signal: 7, longevity: 7, geographic_spread: 3 },
    evidence_summary: 'Источники: HeadHunter Рынок труда 2024, SuperJob SMB Research.',
  },
]

// ── Mock personal matches ─────────────────────────────────────────────────────

export const MOCK_PERSONAL_MATCHES: PersonalPainMatchItem[] = [
  {
    pain_id: 'mt003',
    title: 'Автоматизация налоговой отчётности ИП и МСБ',
    short_description: 'Интеграция банков и ФНС для автоматической отчётности.',
    fit_score: 8.8,
    fit_label: 'high',
    fit_reason_short: 'Финтех-компетенции + опыт работы с ИП',
    market_pain_score: 9.3,
    updated_at: '2026-03-22',
  },
  {
    pain_id: 'mt002',
    title: 'ИИ-автоматизация рутины малого бизнеса',
    short_description: 'ИИ-инструменты для автоматизации переписки и документов.',
    fit_score: 8.2,
    fit_label: 'high',
    fit_reason_short: 'Сильная техническая база + понимание МСБ-болей',
    market_pain_score: 8.1,
    updated_at: '2026-03-22',
  },
  {
    pain_id: 'mt008',
    title: 'Вертикальный SaaS для региональных отраслей',
    short_description: 'Нишевые SaaS-решения для региональных B2B-рынков.',
    fit_score: 7.1,
    fit_label: 'high',
    fit_reason_short: 'Опыт продуктовой разработки + региональный рынок',
    market_pain_score: 7.0,
    updated_at: '2026-03-22',
  },
  {
    pain_id: 'mt005',
    title: 'Маркетплейс-зависимость и диверсификация каналов МСБ',
    short_description: 'Инструменты для выхода продавцов из маркетплейс-зависимости.',
    fit_score: 6.3,
    fit_label: 'medium',
    fit_reason_short: 'Частично совпадает с e-com опытом',
    market_pain_score: 7.9,
    updated_at: '2026-03-22',
  },
  {
    pain_id: 'mt010',
    title: 'HR-автоматизация и онбординг для малого бизнеса',
    short_description: 'Автоматизация найма и онбординга без HR-отдела.',
    fit_score: 5.4,
    fit_label: 'medium',
    fit_reason_short: 'Опыт в автоматизации, но слабая HR-специализация',
    market_pain_score: 7.4,
    updated_at: '2026-03-22',
  },
]

// ── Adapter interface ─────────────────────────────────────────────────────────
// Swap implementation below when connecting real megatrends DB.

export interface PainRegistryAdapter {
  listPains(): Promise<PainListItem[]>
  getPainDetail(id: string): Promise<PainDetailItem | null>
  getPersonalMatches(): Promise<PersonalPainMatchItem[]>
}

// ── Mapping helpers ───────────────────────────────────────────────────────────

function toPainListItem(raw: PainDetailItem): PainListItem {
  return {
    pain_id: raw.pain_id,
    title: raw.title,
    segment: raw.segment,
    short_description: raw.short_description,
    vertical: raw.vertical,
    market_pain_score: raw.market_pain_score,
    evidence_count: raw.evidence_count,
    source_types: raw.source_types,
    last_seen_at: raw.last_seen_at,
    status: raw.status,
    tags: raw.tags,
  }
}

// ── Active adapter ─────────────────────────────────────────────────────────────
// Reads from /api/megatrends (server-side DB via API route).
// Falls back to mock data if API is unavailable.

export const painAdapter: PainRegistryAdapter = {
  async listPains() {
    try {
      const res = await fetch('/api/megatrends', { cache: 'no-store' })
      if (!res.ok) throw new Error('api error')
      const data = await res.json()
      return data.items as PainListItem[]
    } catch {
      return MOCK_REGISTRY.map(toPainListItem)
    }
  },
  async getPainDetail(id) {
    try {
      const res = await fetch(`/api/megatrends/${id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('api error')
      const data = await res.json()
      return data.item as PainDetailItem
    } catch {
      return MOCK_REGISTRY.find(p => p.pain_id === id) ?? null
    }
  },
  async getPersonalMatches() {
    try {
      const res = await fetch('/api/megatrends', { cache: 'no-store' })
      if (!res.ok) throw new Error('api error')
      const data = await res.json()
      return data.matches as PersonalPainMatchItem[]
    } catch {
      return MOCK_PERSONAL_MATCHES
    }
  },
}
