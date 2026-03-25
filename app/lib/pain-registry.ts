// ── UI Types (decoupled from raw backend/pipeline entities) ──────────────────

export type PainStatus = 'new' | 'validated' | 'high_pain' | 'archived'
export type FitLabel = 'high' | 'medium' | 'low'

/** Normalised pain item for list display */
export interface PainListItem {
  pain_id: string
  title: string
  segment: string
  short_description: string
  vertical: string
  market_pain_score: number   // 0–10
  evidence_count: number
  source_types: string[]
  last_seen_at: string        // ISO date string
  status: PainStatus
  tags: string[]
}

/** Personal match item for right-column shortlist */
export interface PersonalPainMatchItem {
  pain_id: string
  title: string
  short_description: string
  fit_score: number           // 0–10
  fit_label: FitLabel
  fit_reason_short: string
  market_pain_score: number
  updated_at: string
}

/** Full detail item for drawer */
export interface PainDetailItem extends PainListItem {
  full_description: string
  target_who: string
  context: string
  workaround: string
  consequences: string
  score_breakdown: {
    frequency: number
    intensity: number
    willingness_to_pay: number
    market_size: number
  }
  evidence_summary: string
  personal_match?: {
    fit_label: FitLabel
    fit_reason_short: string
  }
}

// ── Mock data (pain_registry → PainDetailItem[]) ─────────────────────────────

const MOCK_REGISTRY: PainDetailItem[] = [
  {
    pain_id: 'p001',
    title: 'Непрозрачные начисления ЖКХ',
    segment: 'Жители МКД',
    short_description: 'Жители не могут понять, за что именно они платят и почему сумма меняется каждый месяц.',
    vertical: 'ЖКХ',
    market_pain_score: 8.4,
    evidence_count: 214,
    source_types: ['telegram', 'forum'],
    last_seen_at: '2026-03-20',
    status: 'high_pain',
    tags: ['прозрачность', 'коммуналка', 'ЖКХ', 'УК'],
    full_description: 'Миллионы жителей многоквартирных домов ежемесячно получают квитанции, в которых невозможно проверить правильность начислений. УК и РСО выставляют суммы без детализации, формулы расчёта закрыты, перерасчёты при несогласии — длительная бюрократическая процедура.',
    target_who: 'Собственники квартир в МКД, арендаторы, председатели ТСЖ',
    context: 'В России ~75% жилья — МКД. Управляющие компании обязаны раскрывать данные, но на практике информация труднодоступна или непонятна рядовому жителю.',
    workaround: 'Звонки в УК, самостоятельный расчёт по нормативам, жалобы в ГЖИ. Большинство просто платит.',
    consequences: 'Переплата, потеря доверия к УК, конфликты с соседями при разделе счётов, юридические споры.',
    score_breakdown: { frequency: 9, intensity: 7, willingness_to_pay: 6, market_size: 9 },
    evidence_summary: '214 упоминаний в тематических Telegram-каналах и форумах за последние 30 дней. Рост +18% к прошлому месяцу.',
  },
  {
    pain_id: 'p002',
    title: 'Бухгалтерия для малого бизнеса и ИП',
    segment: 'ИП и малый бизнес',
    short_description: 'Предприниматели тратят 4–10 часов в месяц на бумажную отчётность или платят бухгалтеру за то, что можно автоматизировать.',
    vertical: 'Финансы и учёт',
    market_pain_score: 7.9,
    evidence_count: 187,
    source_types: ['telegram', 'vk', 'otzovik'],
    last_seen_at: '2026-03-22',
    status: 'validated',
    tags: ['бухгалтерия', 'ИП', 'отчётность', 'налоги', 'автоматизация'],
    full_description: 'Большинство ИП на УСН и патенте не могут позволить штатного бухгалтера, но регуляторная нагрузка растёт: ЕФС-1, уведомления по ЕНП, декларации. Существующие решения либо дорогие (1С), либо неудобные (банковские сервисы не покрывают всё).',
    target_who: 'ИП на УСН 6%, УСН 15%, патенте. Малый бизнес до 15 человек.',
    context: 'В России 3,7 млн ИП. ФНС активно развивает электронные сервисы, но интерфейс сложный для неспециалиста.',
    workaround: 'Аутсорсинг (2–5 тыс/мес), самостоятельное ведение через Excel, банковские сервисы с ограниченным функционалом.',
    consequences: 'Штрафы за ошибки, стресс в периоды отчётности, нерациональные затраты на бухгалтера.',
    score_breakdown: { frequency: 8, intensity: 7, willingness_to_pay: 8, market_size: 8 },
    evidence_summary: '187 упоминаний из чатов для предпринимателей и отзывных платформ. Пик активности — конец квартала.',
  },
  {
    pain_id: 'p003',
    title: 'Подбор персонала в малых городах',
    segment: 'Региональный малый бизнес',
    short_description: 'В городах до 150к сложно найти квалифицированного сотрудника: HH и Avito не работают, сарафан непредсказуем.',
    vertical: 'HR и найм',
    market_pain_score: 7.2,
    evidence_count: 143,
    source_types: ['telegram', 'vk'],
    last_seen_at: '2026-03-18',
    status: 'validated',
    tags: ['HR', 'найм', 'регионы', 'подбор', 'персонал'],
    full_description: 'Региональный рынок труда не охвачен федеральными платформами. Работодатели тратят недели на поиск, опираясь на личные связи. Кандидаты не видят локальные вакансии, потому что не пользуются hh.ru.',
    target_who: 'Владельцы кафе, автосервисов, магазинов, небольших производств в малых городах.',
    context: 'В России 1100+ городов с населением до 100 тыс. Это 25 млн жителей и огромный объём микробизнеса.',
    workaround: 'Объявления ВКонтакте, Avito, городские Telegram-чаты, сарафан.',
    consequences: 'Долгое закрытие вакансий, потери выручки, найм неподходящих людей.',
    score_breakdown: { frequency: 7, intensity: 7, willingness_to_pay: 6, market_size: 7 },
    evidence_summary: '143 упоминания в локальных Telegram-каналах и группах ВКонтакте.',
  },
  {
    pain_id: 'p004',
    title: 'Согласование документов с госорганами',
    segment: 'МСП с лицензиями и разрешениями',
    short_description: 'Получение разрешений и лицензий занимает от 2 недель до нескольких месяцев при минимальной ценности каждого шага.',
    vertical: 'Регуляторика',
    market_pain_score: 8.1,
    evidence_count: 198,
    source_types: ['telegram', 'forum', 'vk'],
    last_seen_at: '2026-03-21',
    status: 'high_pain',
    tags: ['госорганы', 'лицензии', 'согласования', 'бюрократия', 'МСП'],
    full_description: 'Любой бизнес с физическим присутствием в РФ сталкивается с согласованиями: пожарная, санэпидемстанция, алкогольная лицензия, разрешение на строительство. Каждый орган — своя очередь, своя форма, своя логика.',
    target_who: 'Кафе, рестораны, медицинские клиники, строительные компании, торговля алкоголем.',
    context: 'Госуслуги частично оцифровали процессы, но практика сильно расходится с теорией. Региональные отличия колоссальные.',
    workaround: 'Специализированные юристы и посредники, «помощники» в комплаенсе.',
    consequences: 'Задержка запуска бизнеса, штрафы, риск закрытия.',
    score_breakdown: { frequency: 8, intensity: 9, willingness_to_pay: 8, market_size: 7 },
    evidence_summary: '198 упоминаний, высокая концентрация в предпринимательских каналах.',
  },
  {
    pain_id: 'p005',
    title: 'Поиск надёжного поставщика для малого ритейла',
    segment: 'Малый ритейл и e-com',
    short_description: 'Владельцы небольших магазинов не знают, как найти поставщика с нормальными ценами, без минимальных заказов на 500к.',
    vertical: 'Торговля и снабжение',
    market_pain_score: 6.8,
    evidence_count: 112,
    source_types: ['telegram', 'otzovik'],
    last_seen_at: '2026-03-15',
    status: 'validated',
    tags: ['поставщики', 'ритейл', 'закупки', 'малый бизнес'],
    full_description: 'Оптовые рынки и крупные дистрибьюторы работают с бизнесами от определённого объёма. Малые магазины покупают дорого через посредников или рискуют на нишевых площадках без гарантий.',
    target_who: 'Владельцы несетевых магазинов, интернет-магазинов с оборотом до 5 млн в месяц.',
    context: 'В России ~350 тыс. МСП в ритейле. Wildberries и Ozon ужесточили условия, часть продавцов ищет собственные каналы.',
    workaround: 'Alibaba, личные связи, оптовые рынки типа Садовода, закупки через перекупов.',
    consequences: 'Высокая себестоимость товара, низкая маржа, нестабильность поставок.',
    score_breakdown: { frequency: 7, intensity: 6, willingness_to_pay: 7, market_size: 7 },
    evidence_summary: '112 упоминаний в торговых чатах и форумах.',
  },
  {
    pain_id: 'p006',
    title: 'Запись к врачу в регионах',
    segment: 'Пациенты государственных поликлиник',
    short_description: 'Записаться к узкому специалисту по ОМС — очередь на 2–6 недель, непредсказуемое расписание.',
    vertical: 'Здравоохранение',
    market_pain_score: 8.7,
    evidence_count: 276,
    source_types: ['telegram', 'vk', 'forum'],
    last_seen_at: '2026-03-23',
    status: 'high_pain',
    tags: ['медицина', 'запись', 'поликлиника', 'ОМС', 'регионы'],
    full_description: 'Очереди к неврологу, кардиологу, эндокринологу в государственных поликлиниках — хронический сбой системы. Записи через Госуслуги работают неровно, через сайт поликлиники — часто недоступны.',
    target_who: 'Жители городов 50–500 тыс., пенсионеры, люди с хроническими заболеваниями.',
    context: 'Нехватка врачей в регионах официально признана. Цифровые сервисы записи внедрены неравномерно.',
    workaround: 'Приходить с утра живой очередью, звонить с 8:00, платная медицина.',
    consequences: 'Запоздалое лечение, ухудшение состояния, переход в платные клиники.',
    score_breakdown: { frequency: 9, intensity: 9, willingness_to_pay: 6, market_size: 9 },
    evidence_summary: '276 упоминаний — один из самых активных болевых кластеров в выборке.',
  },
  {
    pain_id: 'p007',
    title: 'Управление запасами в небольшой рознице',
    segment: 'Несетевой ритейл',
    short_description: 'Владельцы точек не знают, что сейчас на складе, и постоянно либо затаривают, либо теряют продажи.',
    vertical: 'Торговля и снабжение',
    market_pain_score: 6.5,
    evidence_count: 89,
    source_types: ['telegram', 'vk'],
    last_seen_at: '2026-03-14',
    status: 'new',
    tags: ['складской учёт', 'остатки', 'ритейл', 'автоматизация'],
    full_description: 'Большинство несетевых магазинов ведут учёт в тетради или Excel. 1С — дорого и сложно. МойСклад и аналоги есть, но не все доходят до внедрения без сопровождения.',
    target_who: 'Владельцы продуктовых магазинов, хозтоваров, автозапчастей, стройматериалов.',
    context: 'В России ~300+ тыс. несетевых точек. Большинство без автоматизации складского учёта.',
    workaround: 'Excel, тетрадь, визуальный осмотр, 1С для тех, кто смог настроить.',
    consequences: 'Кассовые разрывы из-за неликвидов, потери выручки на отсутствующем товаре.',
    score_breakdown: { frequency: 6, intensity: 6, willingness_to_pay: 7, market_size: 7 },
    evidence_summary: '89 упоминаний в чатах для владельцев магазинов.',
  },
  {
    pain_id: 'p008',
    title: 'Обучение персонала в малом общепите',
    segment: 'Кафе и рестораны до 50 мест',
    short_description: 'Каждый новый сотрудник учится заново — нет стандартизированного онбординга.',
    vertical: 'Образование и HR',
    market_pain_score: 5.9,
    evidence_count: 67,
    source_types: ['telegram'],
    last_seen_at: '2026-03-10',
    status: 'new',
    tags: ['обучение', 'персонал', 'общепит', 'онбординг', 'стандарты'],
    full_description: 'Текучка в общепите — 80–120% в год. Каждое обучение нового кассира/официанта занимает 1–2 недели. Специализированных решений для малого общепита нет.',
    target_who: 'Владельцы кофеен, небольших кафе, пиццерий, уличной еды.',
    context: 'Общепит в России — 170+ тыс. заведений. Малые форматы составляют большую часть.',
    workaround: 'Устный инструктаж, Google Docs с регламентами, старший сотрудник обучает.',
    consequences: 'Ошибки нового персонала, жалобы гостей, повторяющийся стресс у владельца.',
    score_breakdown: { frequency: 6, intensity: 5, willingness_to_pay: 5, market_size: 6 },
    evidence_summary: '67 упоминаний из каналов для владельцев общепита.',
  },
  {
    pain_id: 'p009',
    title: 'Логистика последней мили в малых городах',
    segment: 'E-com покупатели вне крупных городов',
    short_description: 'Доставка из интернет-магазина занимает 7–14 дней вместо 1–2, пункты выдачи переполнены.',
    vertical: 'Логистика',
    market_pain_score: 7.5,
    evidence_count: 156,
    source_types: ['telegram', 'vk', 'otzovik'],
    last_seen_at: '2026-03-19',
    status: 'validated',
    tags: ['доставка', 'логистика', 'е-ком', 'регионы', 'ПВЗ'],
    full_description: 'Крупные маркетплейсы улучшили логистику в миллионниках, но в городах до 100 тыс. ситуация остаётся плохой. Курьерская доставка до двери — редкость.',
    target_who: 'Онлайн-покупатели в городах с населением 30–150 тыс.',
    context: 'E-com в России растёт, но инфраструктура последней мили не успевает. В малых городах 80% покупок всё ещё офлайн.',
    workaround: 'Выбирать только то, что есть на Ozon с быстрой доставкой, ждать, покупать офлайн.',
    consequences: 'Отказ от онлайн-шопинга, возвраты, негативные отзывы на маркетплейсах.',
    score_breakdown: { frequency: 8, intensity: 7, willingness_to_pay: 6, market_size: 8 },
    evidence_summary: '156 упоминаний в потребительских каналах и Ozon/WB отзывах.',
  },
  {
    pain_id: 'p010',
    title: 'Контроль подрядчиков в ремонте',
    segment: 'Собственники жилья и коммерческой недвижимости',
    short_description: 'Нанял бригаду — и не знаешь, придут ли завтра и сделают ли как обещали.',
    vertical: 'Строительство и ремонт',
    market_pain_score: 7.8,
    evidence_count: 168,
    source_types: ['telegram', 'vk', 'forum'],
    last_seen_at: '2026-03-17',
    status: 'high_pain',
    tags: ['ремонт', 'подрядчики', 'контроль', 'бригада', 'стройка'],
    full_description: 'Рынок ремонтных услуг в России — один из самых непрозрачных. Частные бригады работают без договора, предоплата теряется, качество непредсказуемо. Агрегаторы типа YouDo есть, но не решают проблему качества.',
    target_who: 'Собственники квартир на ремонте, владельцы небольших офисов и магазинов.',
    context: 'Рынок ремонта в РФ — ~2 трлн руб./год. Большая часть — теневые расчёты с бригадами.',
    workaround: 'Советы знакомых, YouDo, агрегаторы, личный контроль каждый день.',
    consequences: 'Срыв сроков, перерасход бюджета на 30–60%, скрытые переделки.',
    score_breakdown: { frequency: 7, intensity: 8, willingness_to_pay: 8, market_size: 8 },
    evidence_summary: '168 упоминаний с высоким эмоциональным зарядом в потребительских чатах.',
  },
]

// ── Mock personal matches ─────────────────────────────────────────────────────

export const MOCK_PERSONAL_MATCHES: PersonalPainMatchItem[] = [
  {
    pain_id: 'p002',
    title: 'Бухгалтерия для малого бизнеса и ИП',
    short_description: 'Предприниматели тратят 4–10 часов в месяц на бумажную отчётность.',
    fit_score: 8.8,
    fit_label: 'high',
    fit_reason_short: 'Сильные технические компетенции + опыт работы с ИП',
    market_pain_score: 7.9,
    updated_at: '2026-03-22',
  },
  {
    pain_id: 'p007',
    title: 'Управление запасами в небольшой рознице',
    short_description: 'Постоянно либо затаривают ненужное, либо теряют продажи.',
    fit_score: 7.4,
    fit_label: 'high',
    fit_reason_short: 'Опыт в ритейле + навыки автоматизации процессов',
    market_pain_score: 6.5,
    updated_at: '2026-03-22',
  },
  {
    pain_id: 'p005',
    title: 'Поиск надёжного поставщика для малого ритейла',
    short_description: 'Не знают, как найти поставщика с нормальными ценами без рисков.',
    fit_score: 6.2,
    fit_label: 'medium',
    fit_reason_short: 'Частично совпадает с отраслевым опытом',
    market_pain_score: 6.8,
    updated_at: '2026-03-22',
  },
  {
    pain_id: 'p008',
    title: 'Обучение персонала в малом общепите',
    short_description: 'Каждый новый сотрудник учится заново без стандартов.',
    fit_score: 5.5,
    fit_label: 'medium',
    fit_reason_short: 'Навыки в EdTech, но слабый опыт в общепите',
    market_pain_score: 5.9,
    updated_at: '2026-03-22',
  },
  {
    pain_id: 'p001',
    title: 'Непрозрачные начисления ЖКХ',
    short_description: 'Жители не могут понять, за что именно они платят.',
    fit_score: 3.8,
    fit_label: 'low',
    fit_reason_short: 'Высокая боль рынка, но слабая связь с профилем',
    market_pain_score: 8.4,
    updated_at: '2026-03-22',
  },
]

// ── Data adapter layer ────────────────────────────────────────────────────────
// Maps pain_registry → PainListItem (strips internal fields, normalises shape)

export function toPainListItem(raw: PainDetailItem): PainListItem {
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

export function getPainListItems(): PainListItem[] {
  return MOCK_REGISTRY.map(toPainListItem)
}

export function getPainDetail(id: string): PainDetailItem | undefined {
  return MOCK_REGISTRY.find(p => p.pain_id === id)
}
