import Link from 'next/link'
import { notFound } from 'next/navigation'
import { seedOpportunities } from '@/lib/seed'

const entryModeLabel: Record<string, string> = {
  manual_first: 'Ручной старт',
  productized_service: 'Упакованная услуга',
  lightweight_saas: 'Лёгкий SaaS',
  marketplace: 'Маркетплейс',
  community_led: 'Через сообщество',
  other: 'Другое',
}

const wtpLabel: Record<string, string> = {
  low: 'Низкая', medium: 'Средняя', high: 'Высокая', very_high: 'Очень высокая',
}

export default function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const opp = seedOpportunities.find(o => o.id === params.id)
  if (!opp) notFound()

  return (
    <div style={{ maxWidth: '800px' }}>

      {/* Back */}
      <Link href="/opportunities" style={{
        fontSize: '14px',
        color: '#9B8A7A',
        textDecoration: 'none',
        display: 'inline-block',
        marginBottom: '32px',
      }}>
        ← Все возможности
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ fontSize: '14px', color: '#9B8A7A', marginBottom: '8px' }}>
          {opp.audience}
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#F4EDE3', lineHeight: 1.25, marginBottom: '16px' }}>
          {opp.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#B57A56',
            backgroundColor: 'rgba(181,122,86,0.12)',
            padding: '4px 14px',
            borderRadius: '14px',
          }}>
            {entryModeLabel[opp.recommended_entry_mode]}
          </span>
          <span style={{ fontSize: '13px', color: '#9B8A7A' }}>
            Уверенность {(opp.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Score breakdown */}
      <Section title="Оценка">
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '56px', fontWeight: 700, color: '#D09062', lineHeight: 1 }}>
              {(opp.overall_score * 100).toFixed(0)}
            </div>
            <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.06em', marginTop: '4px' }}>
              ИТОГОВЫЙ БАЛЛ
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            <ScoreRow label="Боль рынка" score={opp.pain_score} />
            <ScoreRow label="Подходимость основателя" score={opp.founder_fit_score} />
            <ScoreRow label="Бизнес-паттерн" score={opp.pattern_score} />
            <ScoreRow label="Возможность входа" score={opp.entry_feasibility_score} />
          </div>
        </div>
        <div style={{ marginTop: '16px', fontSize: '14px', color: '#9B8A7A' }}>
          Готовность платить: <span style={{ color: '#CDBEAE' }}>{wtpLabel[opp.willingness_to_pay]}</span>
        </div>
      </Section>

      {/* Problem */}
      <Section title="Проблема">
        <p style={{ fontSize: '16px', color: '#F4EDE3', lineHeight: 1.65 }}>{opp.problem}</p>
      </Section>

      {/* Risks */}
      <Section title="Риски">
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {opp.risks.map((risk, i) => (
            <li key={i} style={{
              fontSize: '15px',
              color: '#CDBEAE',
              lineHeight: 1.5,
              paddingLeft: '16px',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute',
                left: 0,
                color: '#B57A56',
              }}>·</span>
              {risk}
            </li>
          ))}
        </ul>
      </Section>

      {/* First offer */}
      <Section title="Первое предложение">
        <div style={{
          backgroundColor: '#221C18',
          borderRadius: '18px',
          padding: '20px 24px',
          border: '1px solid rgba(181,122,86,0.15)',
        }}>
          <p style={{ fontSize: '16px', color: '#F4EDE3', lineHeight: 1.65 }}>{opp.first_offer}</p>
        </div>
      </Section>

      {/* First test */}
      <Section title="Первый тест">
        <div style={{
          backgroundColor: '#221C18',
          borderRadius: '18px',
          padding: '20px 24px',
          border: '1px solid rgba(181,122,86,0.15)',
        }}>
          <p style={{ fontSize: '16px', color: '#F4EDE3', lineHeight: 1.65 }}>{opp.first_test}</p>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: '40px',
      paddingBottom: '40px',
      borderBottom: '1px solid rgba(244,237,227,0.06)',
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: '#9B8A7A',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '16px',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function ScoreRow({ label, score }: { label: string; score: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ fontSize: '13px', color: '#CDBEAE', width: '200px', flexShrink: 0 }}>{label}</div>
      <div style={{
        flex: 1,
        height: '4px',
        borderRadius: '2px',
        backgroundColor: 'rgba(244,237,227,0.08)',
      }}>
        <div style={{
          height: '100%',
          width: `${score * 100}%`,
          backgroundColor: '#B57A56',
          borderRadius: '2px',
        }} />
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#D09062', width: '32px', textAlign: 'right' }}>
        {(score * 100).toFixed(0)}
      </div>
    </div>
  )
}
