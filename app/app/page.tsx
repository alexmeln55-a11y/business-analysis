import Link from 'next/link'
import { seedFounderProfile, seedOpportunities, seedSignals } from '@/lib/seed'

const steps = [
  {
    step: '01',
    label: 'Профиль',
    description: 'Расскажи о своём опыте и ресурсах',
    href: '/profile',
    done: true,
  },
  {
    step: '02',
    label: 'Запрос',
    description: 'Опиши задачу — система найдёт возможности',
    href: '/discovery',
    done: false,
  },
  {
    step: '03',
    label: 'Сигналы рынка',
    description: 'Посмотри, какие боли зафиксированы',
    href: '/signals',
    done: true,
  },
  {
    step: '04',
    label: 'Возможности',
    description: 'Оценённый шортлист под твой профиль',
    href: '/opportunities',
    done: seedOpportunities.length > 0,
  },
]

export default function DashboardPage() {
  const profile = seedFounderProfile

  return (
    <div style={{ maxWidth: '720px' }}>

      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ fontSize: '13px', color: '#9B8A7A', marginBottom: '12px', letterSpacing: '0.06em' }}>
          ДОБРО ПОЖАЛОВАТЬ
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#F4EDE3', lineHeight: 1.2, marginBottom: '16px' }}>
          {profile.name}
        </h1>
        <p style={{ fontSize: '16px', color: '#CDBEAE', lineHeight: 1.6 }}>
          Платформа помогает находить сильные бизнес-возможности на рынке РФ —
          не список идей, а отфильтрованный шортлист под твой профиль.
        </p>
      </div>

      {/* Status bar */}
      <div style={{
        backgroundColor: '#1A1613',
        borderRadius: '18px',
        padding: '16px 20px',
        border: '1px solid rgba(244,237,227,0.08)',
        marginBottom: '40px',
        display: 'flex',
        gap: '32px',
      }}>
        <Stat label="Сигналов" value={String(seedSignals.length)} />
        <Stat label="Возможностей" value={String(seedOpportunities.length)} />
        <Stat
          label="Лучший балл"
          value={
            seedOpportunities.length > 0
              ? String(Math.max(...seedOpportunities.map(o => o.overall_score * 100)).toFixed(0))
              : '—'
          }
        />
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {steps.map(({ step, label, description, href, done }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: '#1A1613',
              borderRadius: '18px',
              padding: '20px 24px',
              border: '1px solid rgba(244,237,227,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              transition: 'border-color 0.15s ease',
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: done ? '#B57A56' : '#9B8A7A',
                letterSpacing: '0.06em',
                width: '24px',
                flexShrink: 0,
              }}>
                {done ? '✓' : step}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#F4EDE3', marginBottom: '2px' }}>
                  {label}
                </div>
                <div style={{ fontSize: '13px', color: '#9B8A7A' }}>{description}</div>
              </div>
              <div style={{ fontSize: '18px', color: '#9B8A7A' }}>→</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#D09062' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#9B8A7A', marginTop: '2px' }}>{label}</div>
    </div>
  )
}
