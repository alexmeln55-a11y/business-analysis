import Link from 'next/link'

const BLOCKS = [
  {
    number: 1,
    title: 'Опыт, связи и ресурсы',
    description: 'Навыки, которые уже оплачены рынком. Контакты, открывающие первые двери. Ресурсы для старта.',
    active: true,
  },
  {
    number: 2,
    title: 'Цели и горизонт',
    description: 'Что важно через 12 месяцев. Сколько готовы терпеть неопределённость.',
    active: false,
  },
  {
    number: 3,
    title: 'Рыночные боли',
    description: 'Какие проблемы вы видите в своей отрасли. Что бесит клиентов вокруг вас.',
    active: false,
  },
  {
    number: 4,
    title: 'Конкурентный контекст',
    description: 'Кто уже решает эту боль. Почему у них не получается или получается.',
    active: false,
  },
  {
    number: 5,
    title: 'Режим работы',
    description: 'Как вы строите бизнес: сами или с командой. Продажи или продукт. Быстро или надёжно.',
    active: false,
  },
  {
    number: 6,
    title: 'Итоговый профиль',
    description: 'Синтез всех блоков. Ваш profile как основателя для системы оценки возможностей.',
    active: false,
  },
]

export default function AssessmentPage() {
  return (
    <div style={{ maxWidth: '720px' }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ fontSize: '13px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '12px' }}>
          ДИАГНОСТИКА ОСНОВАТЕЛЯ
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#F4EDE3', lineHeight: 1.2, marginBottom: '16px' }}>
          Распаковка профиля
        </h1>
        <p style={{ fontSize: '16px', color: '#CDBEAE', lineHeight: 1.65, maxWidth: '520px' }}>
          Система оценивает возможности на пересечении рынка и основателя.
          Чем точнее ваш профиль — тем релевантнее результаты.
        </p>
      </div>

      {/* Blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
        {BLOCKS.map((block) => (
          <div key={block.number} style={{
            backgroundColor: block.active ? '#1F1A16' : '#141210',
            borderRadius: '20px',
            padding: '20px 24px',
            border: block.active
              ? '1px solid rgba(181,122,86,0.30)'
              : '1px solid rgba(244,237,227,0.05)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '20px',
            opacity: block.active ? 1 : 0.55,
          }}>
            {/* Number badge */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: block.active ? 'rgba(181,122,86,0.18)' : 'rgba(244,237,227,0.05)',
              border: block.active ? '1px solid rgba(181,122,86,0.4)' : '1px solid rgba(244,237,227,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '2px',
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: block.active ? '#D09062' : '#9B8A7A',
              }}>
                {block.number}
              </span>
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: block.active ? '#F4EDE3' : '#9B8A7A',
                }}>
                  {block.title}
                </span>
                {!block.active && (
                  <span style={{
                    fontSize: '11px',
                    color: '#6B5D52',
                    letterSpacing: '0.06em',
                  }}>
                    СЛЕДУЮЩИЙ ЭТАП
                  </span>
                )}
              </div>
              <p style={{
                fontSize: '14px',
                color: block.active ? '#CDBEAE' : '#6B5D52',
                lineHeight: 1.55,
              }}>
                {block.description}
              </p>
            </div>

            {/* Active indicator */}
            {block.active && (
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#B57A56',
                backgroundColor: 'rgba(181,122,86,0.12)',
                padding: '4px 12px',
                borderRadius: '12px',
                flexShrink: 0,
                alignSelf: 'center',
              }}>
                ДОСТУПЕН
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/assessment/founder-intake" style={{ textDecoration: 'none' }}>
          <button style={{
            backgroundColor: '#B57A56',
            color: '#F4EDE3',
            border: 'none',
            borderRadius: '16px',
            padding: '14px 28px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}>
            Начать диагностику
          </button>
        </Link>
        <span style={{ fontSize: '13px', color: '#6B5D52' }}>
          Блок 1 из 6 · ~10 минут
        </span>
      </div>
    </div>
  )
}
