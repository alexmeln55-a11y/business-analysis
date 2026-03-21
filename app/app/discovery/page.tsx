export default function DiscoveryPage() {
  return (
    <div style={{ maxWidth: '720px' }}>

      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#F4EDE3', marginBottom: '8px' }}>
          Запрос на поиск
        </h1>
        <p style={{ fontSize: '16px', color: '#CDBEAE', lineHeight: 1.6 }}>
          Опиши задачу или область, которую хочешь исследовать.
          Система найдёт рыночные сигналы, подберёт паттерны и сформирует карточки возможностей.
        </p>
      </div>

      {/* Problem input */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: 600,
          color: '#9B8A7A',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}>
          Опиши проблему или область
        </label>
        <textarea
          disabled
          placeholder="Например: хочу найти возможности в малом бизнесе, где владельцы тратят много времени на ручную работу, которую можно автоматизировать без сложного ПО..."
          rows={5}
          style={{
            width: '100%',
            backgroundColor: '#1A1613',
            border: '1px solid rgba(244,237,227,0.08)',
            borderRadius: '18px',
            padding: '16px 20px',
            color: '#9B8A7A',
            fontSize: '15px',
            lineHeight: 1.6,
            resize: 'vertical',
            fontFamily: 'inherit',
            cursor: 'not-allowed',
          }}
        />
      </div>

      {/* Target audience (optional) */}
      <div style={{ marginBottom: '32px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: 600,
          color: '#9B8A7A',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}>
          Целевая аудитория (необязательно)
        </label>
        <input
          disabled
          placeholder="Например: владельцы небольших логистических компаний"
          style={{
            width: '100%',
            backgroundColor: '#1A1613',
            border: '1px solid rgba(244,237,227,0.08)',
            borderRadius: '14px',
            padding: '14px 20px',
            color: '#9B8A7A',
            fontSize: '15px',
            fontFamily: 'inherit',
            cursor: 'not-allowed',
          }}
        />
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          disabled
          style={{
            padding: '14px 32px',
            borderRadius: '18px',
            backgroundColor: '#B57A56',
            color: '#0B0908',
            fontWeight: 600,
            fontSize: '15px',
            border: 'none',
            cursor: 'not-allowed',
            opacity: 0.5,
          }}
        >
          Найти возможности
        </button>
        <span style={{ fontSize: '13px', color: '#9B8A7A' }}>
          Логика поиска подключается в следующем этапе
        </span>
      </div>
    </div>
  )
}
