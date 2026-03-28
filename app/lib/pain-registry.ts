// ── UI Types (decoupled from raw backend/pipeline entities) ──────────────────

export type PainStatus = 'new' | 'validated' | 'high_pain' | 'archived' | 'shortlist' | 'watchlist' | 'archive'
export type FitLabel = 'high' | 'medium' | 'low'
// Shifts-01: confirmed_shift replaces confirmed/candidate
export type ConfirmationStatus = 'signal' | 'topic' | 'confirmed_shift'
export type Priority = 'high' | 'medium' | 'low'

export interface BusinessIdea {
  id: string
  title: string
  summary: string       // что именно даём
  target_user: string   // кому продавать
  problem: string       // какая у людей проблема
  why_now: string
  simple_entry: string
  how_to_earn: string   // как на этом зарабатывать
}

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
  // Shifts-01 fields (optional: not present in mock data)
  confirmation_status?: ConfirmationStatus
  priority?: Priority
  signals_count?: number
  unique_sources_count?: number
  regions_count?: number
  first_seen_at?: string
  active_days?: number
  why_growing?: string
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
  ideas?: BusinessIdea[]  // Shifts-01: business ideas for confirmed_shift
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
    ideas: [
      {
        id: 'mt001-i1', title: 'Помощь с переходом на отечественное ПО',
        target_user: 'IT-отделам в компаниях и госструктурах',
        problem: 'Не знают, с чего начать переход — боятся потерять данные и сломать рабочие процессы',
        summary: 'Аудит того, что есть, готовый план перехода и помощь на каждом шаге',
        how_to_earn: 'Разовая оплата за аудит — от 50 000 руб., потом ежемесячное сопровождение',
        why_now: 'Дедлайн для госсектора — 2025 год', simple_entry: 'Бесплатный мини-аудит за 1 час',
      },
      {
        id: 'mt001-i2', title: 'Онлайн-обучение сотрудников новым программам',
        target_user: 'Компаниям, которые уже перешли на отечественное ПО',
        problem: 'Сотрудники не умеют работать с новыми программами — теряют по 2–3 часа в день',
        summary: 'Короткие видеоуроки по конкретным программам с тестами',
        how_to_earn: 'Подписка для всей компании — от 3 000 руб./мес',
        why_now: 'Переход идёт сейчас, обучение нужно немедленно', simple_entry: 'Бесплатный курс по одной программе',
      },
      {
        id: 'mt001-i3', title: 'Сравнение и подбор отечественного ПО',
        target_user: 'Руководителям и IT-директорам, кто выбирает замену',
        problem: 'Десятки похожих программ, непонятно какая подойдёт — можно купить не то',
        summary: 'Независимое сравнение программ под конкретные задачи с рекомендацией',
        how_to_earn: 'Комиссия от вендоров за каждого приведённого клиента',
        why_now: 'Рынок перехода только начинается', simple_entry: 'Каталог из 20 программ с таблицей сравнения',
      },
    ],
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
    ideas: [
      {
        id: 'mt002-i1', title: 'ИИ-помощник для небольшого бизнеса',
        target_user: 'Владельцам кафе, магазинов, студий, салонов',
        problem: 'Половина дня уходит на переписку с клиентами и мелкие повторяющиеся задачи',
        summary: 'Программа сама отвечает клиентам, напоминает о встречах и делает простые отчёты',
        how_to_earn: 'Подписка 2 000–3 000 руб./мес',
        why_now: 'ИИ-инструменты стали дешёвыми и доступными', simple_entry: 'Бесплатный пробный месяц',
      },
      {
        id: 'mt002-i2', title: 'Сервис для создания маркетинговых текстов',
        target_user: 'Небольшим магазинам и сервисам, кто продаёт в интернете',
        problem: 'Нет времени и денег на копирайтера, а посты и описания нужны каждый день',
        summary: 'Сервис сам пишет посты, рекламу и описания товаров по теме бизнеса',
        how_to_earn: 'Тариф по количеству текстов в месяц — от 500 руб.',
        why_now: 'ИИ-тексты стали качественными и дешёвыми', simple_entry: '5 бесплатных текстов при регистрации',
      },
      {
        id: 'mt002-i3', title: 'Автоматический анализ отзывов клиентов',
        target_user: 'Владельцам бизнеса с отзывами на маркетплейсах и в соцсетях',
        problem: 'Сотни отзывов — не понять, на что жалуются чаще всего и что нужно исправить',
        summary: 'Программа собирает все отзывы и показывает главные проблемы в одном месте',
        how_to_earn: 'Ежемесячная подписка от 1 500 руб. за одну точку продаж',
        why_now: 'Отзывов становится всё больше, вручную не справиться', simple_entry: 'Бесплатный анализ за 7 дней',
      },
    ],
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
    ideas: [
      {
        id: 'mt003-i1', title: 'Автоматическая подготовка деклараций для ИП',
        target_user: 'Индивидуальным предпринимателям без бухгалтера',
        problem: 'Непонятно что подавать, когда и как — боятся ошибиться и получить штраф',
        summary: 'Программа сама считает налоги и формирует документы — нужно только нажать кнопку',
        how_to_earn: 'Подписка 990 руб./мес или разовая оплата 299 руб. за один отчёт',
        why_now: 'ФНС открыл API — технически это стало возможным', simple_entry: 'Первый отчёт бесплатно',
      },
      {
        id: 'mt003-i2', title: 'Бухгалтерский чат-бот для малого бизнеса',
        target_user: 'ИП и небольшим компаниям, кто путается в налогах',
        problem: 'На вопросы про налоги нет простых ответов — всё написано сложным языком',
        summary: 'Чат-бот, которому можно задавать вопросы обычными словами и получать понятные ответы',
        how_to_earn: 'Базовые вопросы бесплатно, консультация с проверкой документов — 500 руб.',
        why_now: 'ЕНП запутал многих предпринимателей', simple_entry: 'Бот в Telegram — бесплатно',
      },
      {
        id: 'mt003-i3', title: 'Простой учёт доходов и расходов для ИП',
        target_user: 'ИП и самозанятым, кто плохо следит за деньгами бизнеса',
        problem: 'В конце месяца непонятно, где деньги — расходы никто не считает',
        summary: 'Простое приложение для записи доходов и расходов с понятными отчётами и графиками',
        how_to_earn: 'Базовые функции бесплатно, расширенные — 499 руб./мес',
        why_now: 'Самозанятых становится всё больше — 10+ млн человек', simple_entry: 'Мобильное приложение, регистрация за 1 минуту',
      },
    ],
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
    ideas: [
      {
        id: 'mt004-i1', title: 'Проверка защиты компании за один день',
        target_user: 'Малому и среднему бизнесу, кто работает с данными клиентов',
        problem: 'Боятся взлома и штрафов, но не знают, что именно нужно исправить',
        summary: 'Проверяем защиту компании и выдаём список конкретных шагов что поправить',
        how_to_earn: 'Разовая проверка от 15 000 руб. + ежемесячное сопровождение от 5 000 руб.',
        why_now: 'Штрафы по 152-ФЗ резко выросли', simple_entry: 'Бесплатная экспресс-проверка за 30 минут',
      },
      {
        id: 'mt004-i2', title: 'Обучение сотрудников правилам безопасности',
        target_user: 'Руководителям компаний и менеджерам по безопасности',
        problem: 'Сотрудники открывают вирусные письма и передают пароли — часто по незнанию',
        summary: 'Короткие уроки и тесты про безопасность в работе — понятно, без технического жаргона',
        how_to_earn: 'Подписка за доступ для всей команды — от 500 руб. в месяц за человека',
        why_now: 'Фишинговые атаки бьют рекорды', simple_entry: 'Бесплатный курс из 3 уроков',
      },
      {
        id: 'mt004-i3', title: 'Готовые документы по безопасности для небольших компаний',
        target_user: 'Малому бизнесу, кто должен соответствовать 152-ФЗ',
        problem: 'Нет юриста и IT-директора, а документы по защите данных нужны',
        summary: 'Набор готовых шаблонов с инструкцией как заполнить и применить в своей компании',
        how_to_earn: 'Разовая покупка пакета документов — 3 000–8 000 руб.',
        why_now: 'Проверки по 152-ФЗ участились', simple_entry: 'Один бесплатный шаблон при регистрации',
      },
    ],
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
    ideas: [
      {
        id: 'mt005-i1', title: 'Быстрый интернет-магазин без маркетплейсов',
        target_user: 'Продавцам на WB и Ozon, кто хочет свой канал продаж',
        problem: 'Растущие комиссии съедают прибыль, а строить свой сайт дорого и долго',
        summary: 'Готовый интернет-магазин за один день без программистов',
        how_to_earn: 'Ежемесячная подписка от 2 000 руб. + процент с продаж',
        why_now: 'WB поднял комиссии до 40% — продавцы ищут выход', simple_entry: '14 дней бесплатно',
      },
      {
        id: 'mt005-i2', title: 'Аналитика продаж на маркетплейсах',
        target_user: 'Продавцам на WB, Ozon и других площадках',
        problem: 'Непонятно, почему продажи падают — нет данных и понятных объяснений',
        summary: 'Простые отчёты: что продаётся хорошо, что плохо и почему',
        how_to_earn: 'Подписка от 1 500 руб./мес за один магазин',
        why_now: 'Конкуренция на маркетплейсах резко выросла', simple_entry: 'Анализ первых 30 дней бесплатно',
      },
      {
        id: 'mt005-i3', title: 'Управление заказами из нескольких мест в одном окне',
        target_user: 'Продавцам, кто торгует и на маркетплейсах, и через соцсети',
        problem: 'Заказы приходят с разных площадок — легко запутаться и что-то пропустить',
        summary: 'Одно окно для управления заказами и остатками со всех площадок',
        how_to_earn: 'Подписка по числу заказов в месяц — от 990 руб.',
        why_now: 'Продавцы выходят на 3–4 площадки одновременно', simple_entry: 'Бесплатно до 50 заказов в месяц',
      },
    ],
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
    ideas: [
      {
        id: 'mt006-i1', title: 'Программа маршрутов для региональных курьеров',
        target_user: 'Небольшим курьерским службам в городах до 300 тыс. человек',
        problem: 'Курьеры ездят по неоптимальным маршрутам — тратят лишнее время и бензин',
        summary: 'Программа строит лучший маршрут на день за пару минут',
        how_to_earn: 'Подписка для диспетчеров курьерской службы — от 3 000 руб./мес',
        why_now: 'E-com в регионах резко вырос, курьеры не справляются', simple_entry: 'Бесплатно для команд до 5 курьеров',
      },
      {
        id: 'mt006-i2', title: 'Учёт посылок для малых пунктов выдачи',
        target_user: 'Владельцам пунктов выдачи в небольших городах',
        problem: 'Нет нормального учёта посылок — всё в тетрадях и на словах, легко потерять',
        summary: 'Простой учёт посылок: что пришло, что выдали, что задержали',
        how_to_earn: 'Абонентская плата за точку — от 1 000 руб./мес',
        why_now: 'Количество ПВЗ в регионах удваивается', simple_entry: 'Первый месяц бесплатно',
      },
      {
        id: 'mt006-i3', title: 'Площадка для заказа местной доставки',
        target_user: 'Небольшим интернет-магазинам в регионах',
        problem: 'Крупные службы доставки не заходят в малые города — нет надёжной доставки',
        summary: 'Площадка для заказа доставки от местных курьеров и небольших служб',
        how_to_earn: 'Комиссия с каждого заказа — 5–8%',
        why_now: 'E-com дошёл до городов с населением 30–50 тыс.', simple_entry: 'Первые 20 заказов без комиссии',
      },
    ],
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
    ideas: [
      {
        id: 'mt007-i1', title: 'Обучение новой профессии за 3 месяца',
        target_user: 'Людям 30–45 лет, кто хочет сменить профессию на более оплачиваемую',
        problem: 'Долгие курсы пугают, а короткие не дают достаточно знаний для работы',
        summary: 'Интенсивная программа с практическими проектами и гарантией трудоустройства',
        how_to_earn: 'Оплата за курс или процент с первой зарплаты после трудоустройства',
        why_now: 'IT-дефицит создаёт огромный спрос на переквалификацию', simple_entry: 'Бесплатный вводный урок',
      },
      {
        id: 'mt007-i2', title: 'Корпоративное обучение навыкам работы с ИИ',
        target_user: 'Компаниям, кто хочет научить сотрудников работать с ИИ-инструментами',
        problem: 'Сотрудники не умеют использовать ИИ в работе — компания теряет время и деньги',
        summary: 'Практические курсы по конкретным ИИ-инструментам под задачи компании',
        how_to_earn: 'Корпоративный контракт — от 50 000 руб. за группу',
        why_now: 'ИИ-инструменты стали обязательными в большинстве профессий', simple_entry: 'Бесплатный мастер-класс для команды',
      },
      {
        id: 'mt007-i3', title: 'Подбор ментора для освоения новой профессии',
        target_user: 'Людям, кто хочет переквалифицироваться, но боится делать это в одиночку',
        problem: 'Самостоятельно учиться сложно — не знаешь с чего начать и как двигаться',
        summary: 'Площадка, где можно найти ментора из нужной сферы и учиться с поддержкой',
        how_to_earn: 'Комиссия с каждой сессии ментора — 15–20%',
        why_now: 'Спрос на менторство вырос вместе с рынком онлайн-обучения', simple_entry: 'Первая сессия с ментором бесплатно',
      },
    ],
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
    ideas: [
      {
        id: 'mt008-i1', title: 'Простая CRM для строительных компаний',
        target_user: 'Небольшим строительным и ремонтным компаниям',
        problem: 'Все заявки в мессенджерах и блокнотах — половина теряется, клиенты уходят',
        summary: 'Простая программа для учёта заявок, договоров и сроков — без лишних функций',
        how_to_earn: 'Подписка от 2 500 руб./мес',
        why_now: 'Строительный рынок растёт, а нормального ПО для малых компаний нет', simple_entry: '30 дней бесплатно',
      },
      {
        id: 'mt008-i2', title: 'Учёт для небольших юридических контор',
        target_user: 'Адвокатам и небольшим юридическим бюро',
        problem: 'Нет удобного способа вести дела, документы и оплаты — всё в Excel',
        summary: 'Удобный учёт дел, документов и платежей в одном месте',
        how_to_earn: 'Подписка от 1 500 руб./мес на адвоката',
        why_now: 'SAP и западные юридические системы ушли из РФ', simple_entry: 'Бесплатно для одного адвоката',
      },
      {
        id: 'mt008-i3', title: 'Управление фермой или агрохозяйством',
        target_user: 'Фермерам и агрохозяйствам в регионах',
        problem: 'Сложно следить за урожаем, техникой и поставками — всё на бумаге',
        summary: 'Простая программа: что посеяно, когда убирать, что куда поставлять',
        how_to_earn: 'Подписка от 3 000 руб./мес, скидка при оплате за год',
        why_now: 'Агро-рынок начал цифровизоваться', simple_entry: 'Бесплатный тариф для хозяйств до 100 га',
      },
    ],
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
    ideas: [
      {
        id: 'mt009-i1', title: 'Персональный план здоровья и профилактики',
        target_user: 'Людям 35–55 лет, кто следит за здоровьем',
        problem: 'Непонятно, какие анализы сдавать, что проверять и как часто — каждый врач говорит разное',
        summary: 'Личный план с понятными шагами: что сдать, когда и зачем',
        how_to_earn: 'Подписка 490 руб./мес или разовая консультация 990 руб.',
        why_now: 'После COVID люди стали думать о здоровье заранее', simple_entry: 'Бесплатная базовая анкета здоровья',
      },
      {
        id: 'mt009-i2', title: 'Напоминания и трекер здоровья',
        target_user: 'Людям, кто хочет следить за здоровьем, но забывает',
        problem: 'Знают что нужно делать, но не делают — нет системы и напоминаний',
        summary: 'Простой дневник здоровья с напоминаниями о препаратах, врачах и анализах',
        how_to_earn: 'Бесплатно базово, расширенные функции — 299 руб./мес',
        why_now: 'Смартфоны позволяют делать это просто', simple_entry: 'Приложение, настройка за 5 минут',
      },
      {
        id: 'mt009-i3', title: 'Чекап-пакеты для корпоративных клиентов',
        target_user: 'HR-отделам и компаниям, кто заботится о здоровье сотрудников',
        problem: 'Хотят предложить сотрудникам ДМС или чекап, но стандартные пакеты дорогие и негибкие',
        summary: 'Гибкие пакеты чекапов под разный бюджет с оперативным результатом',
        how_to_earn: 'Продажа корпоративных пакетов + комиссия с медицинских партнёров',
        why_now: 'Конкуренция за сотрудников заставляет улучшать льготы', simple_entry: 'Демо-чекап для команды HR',
      },
    ],
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
    ideas: [
      {
        id: 'mt010-i1', title: 'Простой инструмент для найма в малом бизнесе',
        target_user: 'Владельцам магазинов, кафе, небольших компаний',
        problem: 'На поиск и оформление одного сотрудника уходит 2–3 недели — нет времени',
        summary: 'Готовые шаблоны вакансий, базовый отбор и автоматическое оформление',
        how_to_earn: 'Подписка 1 500 руб./мес или плата за закрытую вакансию',
        why_now: 'Кадровый дефицит заставляет нанимать быстрее', simple_entry: 'Первая вакансия бесплатно',
      },
      {
        id: 'mt010-i2', title: 'Онбординг новых сотрудников без руководителя',
        target_user: 'Компаниям с высокой текучкой: ритейл, общепит, сервис',
        problem: 'Каждый новый сотрудник требует 2 недели ручного обучения от руководителя',
        summary: 'Готовые онбординг-программы: видео, инструкции, тесты — новый сотрудник разбирается сам',
        how_to_earn: 'Подписка от 3 000 руб./мес за неограниченное число сотрудников',
        why_now: 'Текучка в МСБ 60–120% в год — без автоматизации не справиться', simple_entry: 'Готовый шаблон для кассира/продавца бесплатно',
      },
      {
        id: 'mt010-i3', title: 'Чат-бот для ответов на вопросы новых сотрудников',
        target_user: 'HR-менеджерам и руководителям небольших команд',
        problem: 'Новые сотрудники спрашивают одно и то же по 50 раз — отвлекают от работы',
        summary: 'Чат-бот знает всё о компании и отвечает на вопросы новеньких круглосуточно',
        how_to_earn: 'Подписка 990 руб./мес',
        why_now: 'Мессенджеры теперь везде — внедрение занимает один день', simple_entry: 'Бесплатный чат-бот с базой из 20 вопросов',
      },
    ],
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

function deriveConfirmationStatus(status: PainStatus): ConfirmationStatus {
  if (status === 'shortlist' || status === 'high_pain' || status === 'validated') return 'confirmed_shift'
  if (status === 'watchlist') return 'topic'
  return 'signal'
}

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
    confirmation_status: raw.confirmation_status ?? deriveConfirmationStatus(raw.status),
  }
}

// ── Active adapter ─────────────────────────────────────────────────────────────
// Single fetch dedup: listPains() and getPersonalMatches() share one network request
// when called in the same Promise.all tick.

let _pendingFetch: Promise<{ items: PainListItem[]; matches: PersonalPainMatchItem[] }> | null = null
const _detailCache = new Map<string, PainDetailItem>()

function fetchAll(): Promise<{ items: PainListItem[]; matches: PersonalPainMatchItem[] }> {
  if (!_pendingFetch) {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('fetch timeout')), 8000)
    )
    _pendingFetch = Promise.race([
      fetch('/api/megatrends', { cache: 'no-store' })
        .then(r => { if (!r.ok) throw new Error('api error'); return r.json() })
        .then(data => ({ items: data.items as PainListItem[], matches: data.matches as PersonalPainMatchItem[] })),
      timeout,
    ]).finally(() => { _pendingFetch = null }) as Promise<{ items: PainListItem[]; matches: PersonalPainMatchItem[] }>
  }
  return _pendingFetch!
}

export const painAdapter: PainRegistryAdapter = {
  async listPains() {
    try {
      const { items } = await fetchAll()
      return items
    } catch {
      return MOCK_REGISTRY.map(toPainListItem)
    }
  },
  async getPainDetail(id) {
    if (_detailCache.has(id)) return _detailCache.get(id)!
    try {
      const res = await fetch(`/api/megatrends/${id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('api error')
      const data = await res.json()
      const item = data.item as PainDetailItem
      _detailCache.set(id, item)
      return item
    } catch {
      return MOCK_REGISTRY.find(p => p.pain_id === id) ?? null
    }
  },
  async getPersonalMatches() {
    try {
      const { matches } = await fetchAll()
      return matches
    } catch {
      return MOCK_PERSONAL_MATCHES
    }
  },
}
