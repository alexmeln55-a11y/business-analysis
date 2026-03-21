// Rich mock content for opportunity detail pages.
// Extends seed data with UI-only editorial content.
// Will be replaced by real data after backend is connected.

export interface ForeignPattern {
  name: string
  country: string
  description: string
  what_transfers: string
}

export interface OppDetail {
  shortlist_reason: string
  why_strong: string
  score_explanation: string
  pain_detail: {
    who: string
    what: string
    urgency_reason: string
    evidence: string[]
  }
  founder_fit_detail: {
    why_fits: string[]
    watch_out: string[]
  }
  foreign_patterns: ForeignPattern[]
  entry_detail: {
    why_feasible: string
    why_this_mode: string
  }
}

export const mockOppDetails: Record<string, OppDetail> = {
  'opp-001': {
    shortlist_reason: 'Острая боль + высокий founder fit + проверенный зарубежный паттерн',
    why_strong:
      'Проблема перезрелая: тысячи магазинов до сих пор считают товар в Excel. Рынок не консолидирован на уровне малого бизнеса, а у основателя есть прямой доступ к этому сегменту через личную сеть.',
    score_explanation:
      'Балл 76 обусловлен высокой болью рынка (82) и хорошей входимостью (79). Паттерн-скор средний (61) — аналоги есть, но РФ-специфика требует адаптации. Founder fit 74 — основатель знает малый бизнес, но без опыта в розничной ИТ.',
    pain_detail: {
      who: 'Владельцы розничных магазинов от 1 точки до 5, штат 5–50 человек',
      what: 'Нет понимания, какой товар реально продаётся. Деньги заморожены в неликвидах. Excel не справляется, WMS-системы стоят от 30к/мес.',
      urgency_reason:
        'Деньги в товарных остатках — прямые потери прямо сейчас. Каждый месяц без контроля равен упущенной выручке.',
      evidence: [
        'Сигнал signal-001: сила доказательств — strong, частота — pervasive',
        'Владельцы из сети основателя подтвердили проблему при первом разговоре',
        'Аналог: Shopify Analytics растёт 40%/год именно на сегменте малого ритейла',
      ],
    },
    founder_fit_detail: {
      why_fits: [
        'Опыт b2b-продаж — умеет продавать малому бизнесу без технического языка',
        'Высокая толерантность к ручной работе — manual_first без риска выгорания',
        'Доступ через личную сеть — не нужны холодные каналы на старте',
      ],
      watch_out: [
        'Нет опыта в розничной ИТ — нужен технический партнёр для интеграций',
        'Beginner в разработке — MVP должен быть максимально без кода',
      ],
    },
    foreign_patterns: [
      {
        name: 'Cin7 Omni',
        country: 'Новая Зеландия / США',
        description:
          'Inventory management для малой розницы, начинали с консультаций и ручного внедрения.',
        what_transfers:
          'Модель "сначала услуга, потом SaaS" хорошо работает в РФ, где доверие строится через личный контакт.',
      },
      {
        name: 'Vend (Lightspeed)',
        country: 'Австралия',
        description:
          'POS + аналитика остатков для ритейла, позиционировался как "Excel-killer".',
        what_transfers:
          'Позиционирование "замени Excel" — понятное сообщение для РФ-аудитории без технического бэкграунда.',
      },
      {
        name: 'Loyverse',
        country: 'Россия / Кипр',
        description: 'Бесплатная POS с аналитикой, 200k+ пользователей в РФ.',
        what_transfers:
          'Freemium-вход снижает барьер; дифференциация через личный сервис и ручной онбординг.',
      },
    ],
    entry_detail: {
      why_feasible:
        'Не требует разработки на старте. Можно начать с таблицы + консультации и проверить спрос без продукта.',
      why_this_mode:
        'manual_first выбран потому что основатель умеет продавать, может проводить аудиты лично, и это создаёт доверие быстрее любого SaaS.',
    },
  },

  'opp-002': {
    shortlist_reason: 'Высокая срочность + Telegram-бот как entry без разработки',
    why_strong:
      'WhatsApp-диспетчеризация — боль, которую легко показать за 10 минут разговора. Решение на базе Telegram-бота собирается за неделю без программирования.',
    score_explanation:
      'Балл 64 — рынок реальный, но конкуренция с привычкой к WhatsApp снижает founder fit (65) и feasibility (62). Паттерн-скор низкий (55) — западные аналоги не адаптированы под РФ-специфику мессенджеров.',
    pain_detail: {
      who: 'Диспетчеры транспортных компаний с 10–30 машинами',
      what: 'Управление через WhatsApp: сообщения теряются, нет структуры, клиенты не получают статус заказа вовремя.',
      urgency_reason:
        'Каждая задержка — жалоба клиента или штраф. Боль острая, но привычка к WhatsApp снижает срочность смены инструмента.',
      evidence: [
        'Сигнал signal-002: сила доказательств — moderate, частота — frequent',
        'Диспетчеры жалуются на WhatsApp-хаос, но боятся менять привычный инструмент',
      ],
    },
    founder_fit_detail: {
      why_fits: [
        'Опыт в логистике — основатель знает боль изнутри',
        'Умеет работать с малым бизнесом и объяснять ценность без технического языка',
      ],
      watch_out: [
        'Нет опыта в Telegram-ботах — нужен технический исполнитель',
        'Средняя толерантность к длинному циклу продаж — цикл здесь может растянуться',
      ],
    },
    foreign_patterns: [
      {
        name: 'Circuit for Teams',
        country: 'США / Великобритания',
        description:
          'Route optimization + диспетчеризация для малых курьерских компаний.',
        what_transfers:
          'Простота и мобильный интерфейс — именно то, что ценят РФ-диспетчеры, перегруженные звонками.',
      },
      {
        name: 'Onfleet',
        country: 'США',
        description:
          'Delivery management platform, начинали с ручного онбординга клиентов.',
        what_transfers:
          'Интеграция с мессенджерами — в РФ Telegram заменяет их нотификационный слой.',
      },
    ],
    entry_detail: {
      why_feasible:
        'Telegram-бот собирается за неделю на no-code платформах. Мобильное приложение не нужно на старте.',
      why_this_mode:
        'productized_service выбран потому что клиент платит за настройку и поддержку бота — понятная модель для малого транспортного бизнеса.',
    },
  },
}
