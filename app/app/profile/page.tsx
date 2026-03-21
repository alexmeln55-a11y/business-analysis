import { seedFounderProfile } from '@/lib/seed'

const toleranceLabel: Record<string, string> = {
  low: 'Низкая', medium: 'Средняя', high: 'Высокая',
  short_only: 'Только короткие', medium_ok: 'Средние — ок', long_ok: 'Длинные — ок',
}

export default function ProfilePage() {
  const profile = seedFounderProfile

  return (
    <div style={{ maxWidth: '720px' }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#F4EDE3', marginBottom: '8px' }}>
          Твой профиль
        </h1>
        <p style={{ fontSize: '16px', color: '#CDBEAE', lineHeight: 1.6 }}>
          Система оценивает возможности под твой конкретный профиль — опыт, ресурсы, горизонт.
        </p>
      </div>

      {/* Form (read-only seed view for now) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        <Field label="Имя" value={profile.name} />

        <Field
          label="Опытные области"
          value={profile.experience_domains.join(', ')}
        />

        <div>
          <Label text="Навыки" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {Object.entries(profile.skills).map(([skill, level]) => (
              <span key={skill} style={{
                fontSize: '13px',
                padding: '4px 12px',
                borderRadius: '14px',
                backgroundColor: 'rgba(181,122,86,0.12)',
                color: '#CDBEAE',
                border: '1px solid rgba(181,122,86,0.2)',
              }}>
                {skill} — {level}
              </span>
            ))}
          </div>
        </div>

        <Field
          label="Каналы привлечения клиентов"
          value={profile.distribution_access.join(', ')}
        />

        <Field
          label="Горизонт планирования"
          value={`${profile.time_horizon_months} месяцев`}
        />

        <Field
          label="Готовность к ручной работе"
          value={toleranceLabel[profile.manual_work_tolerance]}
        />

        <Field
          label="Готовность к длинным циклам продаж"
          value={toleranceLabel[profile.sales_cycle_tolerance]}
        />

        {/* Save button (placeholder) */}
        <div style={{ paddingTop: '8px' }}>
          <button
            disabled
            style={{
              padding: '12px 28px',
              borderRadius: '18px',
              backgroundColor: '#B57A56',
              color: '#0B0908',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor: 'not-allowed',
              opacity: 0.6,
            }}
          >
            Сохранить профиль
          </button>
          <span style={{ fontSize: '12px', color: '#9B8A7A', marginLeft: '16px' }}>
            Редактирование — в следующем этапе
          </span>
        </div>
      </div>
    </div>
  )
}

function Label({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: '12px',
      fontWeight: 600,
      color: '#9B8A7A',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginBottom: '6px',
    }}>
      {text}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      backgroundColor: '#1A1613',
      borderRadius: '18px',
      padding: '16px 20px',
      border: '1px solid rgba(244,237,227,0.08)',
    }}>
      <Label text={label} />
      <div style={{ fontSize: '16px', color: '#F4EDE3' }}>{value}</div>
    </div>
  )
}
