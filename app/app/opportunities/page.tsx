import Link from 'next/link'
import { seedOpportunities } from '@/lib/seed'
import { mockOppDetails } from '@/lib/mock-details'

const entryModeLabel: Record<string, string> = {
  manual_first: 'Ручной старт',
  productized_service: 'Упакованная услуга',
  lightweight_saas: 'Лёгкий SaaS',
  marketplace: 'Маркетплейс',
  community_led: 'Через сообщество',
  other: 'Другое',
}

export default function OpportunitiesPage() {
  const opportunities = seedOpportunities.sort((a, b) => b.overall_score - a.overall_score)

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#F4EDE3', marginBottom: '8px' }}>
          Возможности
        </h1>
        <p style={{ fontSize: '16px', color: '#CDBEAE' }}>
          {opportunities.length} возможности · отсортировано по баллу
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {opportunities.map(opp => {
          const detail = mockOppDetails[opp.id]
          return (
            <Link key={opp.id} href={`/opportunities/${opp.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: '#1A1613',
                borderRadius: '24px',
                padding: '24px',
                border: '1px solid rgba(244,237,227,0.08)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.26)',
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>

                  {/* Left: content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: '#9B8A7A', marginBottom: '6px' }}>
                      {opp.audience}
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#F4EDE3', marginBottom: '10px', lineHeight: 1.3 }}>
                      {opp.title}
                    </h2>

                    {/* Shortlist reason */}
                    {detail && (
                      <div style={{
                        fontSize: '13px',
                        color: '#B57A56',
                        marginBottom: '16px',
                        lineHeight: 1.4,
                      }}>
                        {detail.shortlist_reason}
                      </div>
                    )}

                    {/* Score bars */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <ScoreBar label="Боль" score={opp.pain_score} />
                      <ScoreBar label="Фит" score={opp.founder_fit_score} />
                      <ScoreBar label="Паттерн" score={opp.pattern_score} />
                      <ScoreBar label="Вход" score={opp.entry_feasibility_score} />
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#9B8A7A' }}>
                        Уверенность {(opp.confidence * 100).toFixed(0)}%
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#B57A56',
                        backgroundColor: 'rgba(181,122,86,0.12)',
                        padding: '3px 12px',
                        borderRadius: '14px',
                      }}>
                        {entryModeLabel[opp.recommended_entry_mode]}
                      </span>
                    </div>
                  </div>

                  {/* Right: score */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '48px', fontWeight: 700, color: '#D09062', lineHeight: 1 }}>
                      {(opp.overall_score * 100).toFixed(0)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.06em', marginTop: '4px' }}>
                      БАЛЛ
                    </div>
                  </div>

                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div style={{ minWidth: '80px' }}>
      <div style={{ fontSize: '11px', color: '#9B8A7A', marginBottom: '4px' }}>{label}</div>
      <div style={{
        height: '4px',
        borderRadius: '2px',
        backgroundColor: 'rgba(244,237,227,0.08)',
        overflow: 'hidden',
        width: '80px',
      }}>
        <div style={{
          height: '100%',
          width: `${score * 100}%`,
          backgroundColor: '#B57A56',
          borderRadius: '2px',
        }} />
      </div>
      <div style={{ fontSize: '11px', color: '#CDBEAE', marginTop: '2px' }}>
        {(score * 100).toFixed(0)}
      </div>
    </div>
  )
}
