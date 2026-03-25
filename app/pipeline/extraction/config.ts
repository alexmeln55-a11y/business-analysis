export interface TopicConfig {
  topic_id: string
  topic_name: string
  vertical: string
  audiences: string[]
  pain_types: string[]
  query_patterns: string[]
  negative_patterns: string[]
  source_channels: Array<{ username: string; name: string }>
  priority: number
}

// Patterns for detecting pain signals in Russian text
const PAIN_SIGNALS_RU = [
  'нельзя', 'невозможно', 'не работает', 'не могу', 'не дают',
  'проблем', 'жалоб', 'жалую', 'бесит', 'ужас', 'кошмар',
  'задержк', 'срыв', 'обман', 'мошенн', 'кидают', 'потеря',
  'штраф', 'переплач', 'дорого стоит', 'нет возможности',
  'никак не', 'сложно', 'неудобно', 'долго жду', 'месяцами',
  'до сих пор', 'опять', 'снова', 'в очередной раз',
]

export const TOPICS: TopicConfig[] = [
  {
    topic_id: 'transport_logistics',
    topic_name: 'Транспорт и логистика',
    vertical: 'Логистика',
    audiences: [
      'Перевозчики', 'Экспедиторы', 'Получатели грузов',
      'Интернет-магазины', 'Дистрибьюторы', 'Физлица',
    ],
    pain_types: [
      'задержки и срыв сроков',
      'потеря и порча груза',
      'непрозрачность отслеживания',
      'высокие тарифы',
      'документооборот',
      'последняя миля',
      'таможенное оформление',
    ],
    query_patterns: [
      ...PAIN_SIGNALS_RU,
      'доставк', 'груз', 'перевозк', 'логистик', 'транспорт',
      'курьер', 'ПВЗ', 'пункт выдачи', 'трек', 'отслежи',
      'таможня', 'накладная', 'маршрутный лист', 'водитель',
    ],
    negative_patterns: [
      'реклам', 'вакансия', 'требуется водитель', 'ищем партнёров',
      'скидк', 'акция', 'распродажа',
    ],
    source_channels: [
      // Добавьте реальные каналы из вашей ниши
      // { username: 'имя_канала', name: 'Название канала' },
    ],
    priority: 1,
  },
  {
    topic_id: 'finance_accounting',
    topic_name: 'Финансы и бухгалтерия',
    vertical: 'Финансы и учёт',
    audiences: [
      'ИП', 'ООО малый бизнес', 'Бухгалтеры',
      'Самозанятые', 'Фрилансеры',
    ],
    pain_types: [
      'налоговая отчётность',
      'ЕНП и ЕНС',
      'банковские блокировки',
      'валютный контроль',
      'расчёт зарплаты',
      'первичная документация',
      'онлайн-касса',
    ],
    query_patterns: [
      ...PAIN_SIGNALS_RU,
      'налог', 'отчётност', 'ФНС', 'бухгалтер', 'ИП', 'ООО',
      'ЕНП', 'ЕНС', 'декларац', 'НДФЛ', 'НДС', 'УСН',
      'расчётный счёт', 'блокировк', 'заморозк', 'банк отказ',
      'касса', 'ОФД', 'электронная подпись',
    ],
    negative_patterns: [
      'реклам', 'предлагаем', 'наши услуги', 'вакансия',
      'скидк', 'акция',
    ],
    source_channels: [
      // Добавьте реальные каналы
    ],
    priority: 1,
  },
  {
    topic_id: 'it_technology',
    topic_name: 'IT и технологии',
    vertical: 'IT',
    audiences: [
      'IT-команды', 'Стартапы', 'CTO/Tech leads',
      'Разработчики', 'Продуктовые команды',
    ],
    pain_types: [
      'инфраструктура и DevOps',
      'найм разработчиков',
      'ограничения на иностранные сервисы',
      'безопасность данных',
      'интеграции с российскими системами',
      'документация и требования',
      'тестирование',
    ],
    query_patterns: [
      ...PAIN_SIGNALS_RU,
      'сервер', 'деплой', 'прод', 'разработчик', 'джун',
      'хостинг', 'облако', 'VPS', 'заблокирован', 'недоступен',
      'сертификат', 'SSL', 'импортозамещ', 'отечественн',
      'интеграция', 'API', 'баг', 'падает', 'лагает',
    ],
    negative_patterns: [
      'реклам', 'вакансия', 'требуется', 'нанимаем',
      'курс', 'обучение', 'конференция',
    ],
    source_channels: [
      // Добавьте реальные каналы
    ],
    priority: 2,
  },
]

export function getTopicById(id: string): TopicConfig | undefined {
  return TOPICS.find(t => t.topic_id === id)
}

export function isLikelyPainSignal(text: string, topic: TopicConfig): boolean {
  const lower = text.toLowerCase()
  const hasPainWord = topic.query_patterns.some(p => lower.includes(p.toLowerCase()))
  const hasNegative = topic.negative_patterns.some(p => lower.includes(p.toLowerCase()))
  return hasPainWord && !hasNegative
}
