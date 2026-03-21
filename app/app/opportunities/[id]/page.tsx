import Link from 'next/link'
import { notFound } from 'next/navigation'
import { seedOpportunities } from '@/lib/seed'
import { mockOppDetails, type ForeignPattern } from '@/lib/mock-details'

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

  const detail = mockOppDetails[opp.id]

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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
          <span style={{ fontSize: '13px', color: '#9B8A7A' }}>
            Готовность платить: <span style={{ color: '#CDBEAE' }}>{wtpLabel[opp.willingness_to_pay]}</span>
          </span>
        </div>
      </div>

      {/* Brief description */}
      <Section title="Описание">
        <p style={{ fontSize: '16px', color: '#F4EDE3', lineHeight: 1.65 }}>{opp.problem}</p>
      </Section>

      {/* Why strong */}
      {detail && (
        <Section title="Почему это сильная возможность">
          <div style={{
            backgroundColor: '#1F1A16',
            borderRadius: '16px',
            padding: '20px 24px',
            borderLeft: '3px solid #B57A56',
          }}>
            <p style={{ fontSize: '16px', color: '#F4EDE3', lineHeight: 1.65 }}>{detail.why_strong}</p>
          </div>
        </Section>
      )}

      {/* Score breakdown */}
      <Section title="Оценка">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: '56px', fontWeight: 700, color: '#D09062', lineHeight: 1 }}>
              {(opp.overall_score * 100).toFixed(0)}
            </div>
            <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.06em', marginTop: '4px' }}>
              ИТОГОВЫЙ БАЛЛ
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '200px' }}>
            <ScoreRow label="Market Pain" score={opp.pain_score} />
            <ScoreRow label="Founder Fit" score={opp.founder_fit_score} />
            <ScoreRow label="Foreign Patterns" score={opp.pattern_score} />
            <ScoreRow label="Entry Feasibility" score={opp.entry_feasibility_score} />
          </div>
        </div>
        {detail && (
          <div style={{
            backgroundColor: '#1A1613',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid rgba(244,237,227,0.06)',
          }}>
            <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '8px' }}>
              ПОЧЕМУ ТАКОЙ БАЛЛ
            </div>
            <p style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.6 }}>{detail.score_explanation}</p>
          </div>
        )}
      </Section>

      {/* 4 filters */}
      {detail && (
        <>
          {/* 1. Market Pain */}
          <Section title="Market Pain — Боль рынка">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FilterRow label="Кто страдает" value={detail.pain_detail.who} />
              <FilterRow label="В чём боль" value={detail.pain_detail.what} />
              <FilterRow label="Почему срочно" value={detail.pain_detail.urgency_reason} />
              <div>
                <div style={{ fontSize: '12px', color: '#9B8A7A', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  ДОКАЗАТЕЛЬСТВА
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {detail.pain_detail.evidence.map((e, i) => (
                    <li key={i} style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.5, paddingLeft: '14px', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: '#B57A56' }}>·</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          {/* 2. Founder Fit */}
          <Section title="Founder Fit — Подходимость основателя">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#B57A56', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  ПОЧЕМУ ПОДХОДИТ
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {detail.founder_fit_detail.why_fits.map((item, i) => (
                    <li key={i} style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.5, paddingLeft: '14px', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: '#B57A56' }}>+</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {detail.founder_fit_detail.watch_out.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: '#9B8A7A', marginBottom: '8px', letterSpacing: '0.04em' }}>
                    НА ЧТО ОБРАТИТЬ ВНИМАНИЕ
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {detail.founder_fit_detail.watch_out.map((item, i) => (
                      <li key={i} style={{ fontSize: '14px', color: '#9B8A7A', lineHeight: 1.5, paddingLeft: '14px', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0 }}>—</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Section>

          {/* 3. Foreign Patterns */}
          <Section title="Foreign Patterns — Зарубежные паттерны">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {detail.foreign_patterns.map((p, i) => (
                <PatternCard key={i} pattern={p} />
              ))}
            </div>
          </Section>

          {/* 4. Entry Feasibility */}
          <Section title="Entry Feasibility — Возможность входа">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FilterRow label="Почему вход реалистичен" value={detail.entry_detail.why_feasible} />
              <FilterRow label="Почему выбран этот режим" value={detail.entry_detail.why_this_mode} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: '#9B8A7A' }}>РЕЖИМ ВХОДА</span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#B57A56',
                  backgroundColor: 'rgba(181,122,86,0.12)',
                  padding: '4px 14px',
                  borderRadius: '14px',
                }}>
                  {entryModeLabel[opp.recommended_entry_mode]}
                </span>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* Risks */}
      <Section title="Основные риски">
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {opp.risks.map((risk, i) => (
            <li key={i} style={{
              fontSize: '15px',
              color: '#CDBEAE',
              lineHeight: 1.5,
              paddingLeft: '16px',
              position: 'relative',
            }}>
              <span style={{ position: 'absolute', left: 0, color: '#B57A56' }}>·</span>
              {risk}
            </li>
          ))}
        </ul>
      </Section>

      {/* First offer */}
      <Section title="Рекомендуемый способ входа">
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
      <div style={{ fontSize: '13px', color: '#CDBEAE', width: '160px', flexShrink: 0 }}>{label}</div>
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

function FilterRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: '#9B8A7A', marginBottom: '4px', letterSpacing: '0.04em' }}>
        {label.toUpperCase()}
      </div>
      <p style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.6 }}>{value}</p>
    </div>
  )
}

function PatternCard({ pattern }: { pattern: ForeignPattern }) {
  return (
    <div style={{
      backgroundColor: '#1A1613',
      borderRadius: '16px',
      padding: '18px 20px',
      border: '1px solid rgba(244,237,227,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#F4EDE3' }}>{pattern.name}</span>
        <span style={{ fontSize: '12px', color: '#9B8A7A' }}>{pattern.country}</span>
      </div>
      <p style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.55, marginBottom: '10px' }}>
        {pattern.description}
      </p>
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '10px 14px',
        backgroundColor: 'rgba(181,122,86,0.07)',
        borderRadius: '10px',
        borderLeft: '2px solid rgba(181,122,86,0.4)',
      }}>
        <span style={{ fontSize: '12px', color: '#B57A56', flexShrink: 0, paddingTop: '1px' }}>→</span>
        <p style={{ fontSize: '13px', color: '#CDBEAE', lineHeight: 1.5 }}>{pattern.what_transfers}</p>
      </div>
    </div>
  )
}
