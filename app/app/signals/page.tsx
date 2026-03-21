'use client'

import { useState } from 'react'
import { seedSignals } from '@/lib/seed'
import type { MarketSignal } from '@/lib/types'

const strengthLabel: Record<string, string> = {
  anecdotal: 'Анекдотическое', weak: 'Слабое', moderate: 'Среднее', strong: 'Сильное',
}
const urgencyLabel: Record<string, string> = {
  low: 'Низкая', medium: 'Средняя', high: 'Высокая', critical: 'Критическая',
}
const frequencyLabel: Record<string, string> = {
  rare: 'Редко', occasional: 'Иногда', frequent: 'Часто', pervasive: 'Повсеместно',
}
const strengthColor: Record<string, string> = {
  anecdotal: '#9B8A7A', weak: '#9B8A7A', moderate: '#B57A56', strong: '#D09062',
}

export default function SignalsPage() {
  const [selected, setSelected] = useState<MarketSignal | null>(seedSignals[0])

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#F4EDE3', marginBottom: '8px' }}>
          Сигналы рынка
        </h1>
        <p style={{ fontSize: '16px', color: '#CDBEAE' }}>
          {seedSignals.length} сигналов
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Signal list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {seedSignals.map(signal => (
            <button
              key={signal.id}
              onClick={() => setSelected(signal)}
              style={{
                textAlign: 'left',
                backgroundColor: selected?.id === signal.id ? 'rgba(181,122,86,0.10)' : '#1A1613',
                border: selected?.id === signal.id
                  ? '1px solid #B57A56'
                  : '1px solid rgba(244,237,227,0.08)',
                borderRadius: '18px',
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '14px', color: '#9B8A7A', marginBottom: '6px' }}>
                {signal.audience}
              </div>
              <div style={{
                fontSize: '15px',
                color: '#F4EDE3',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: '12px',
              }}>
                {signal.problem}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Badge label={strengthLabel[signal.evidence_strength]} color={strengthColor[signal.evidence_strength]} />
                <Badge label={urgencyLabel[signal.urgency]} color="#9B8A7A" />
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            backgroundColor: '#1A1613',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid rgba(244,237,227,0.08)',
            alignSelf: 'start',
            position: 'sticky',
            top: '80px',
          }}>
            <DetailRow label="Аудитория" value={selected.audience} />
            <DetailRow label="Проблема" value={selected.problem} />
            {selected.current_workaround && (
              <DetailRow label="Как справляются сейчас" value={selected.current_workaround} />
            )}
            <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
              <Stat label="Доказательство" value={strengthLabel[selected.evidence_strength]} />
              <Stat label="Частота" value={frequencyLabel[selected.frequency]} />
              <Stat label="Срочность" value={urgencyLabel[selected.urgency]} />
            </div>
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(244,237,227,0.08)',
              fontSize: '13px',
              color: '#9B8A7A',
            }}>
              Уверенность: {(selected.confidence * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.05em',
      color,
      backgroundColor: 'rgba(244,237,227,0.05)',
      padding: '3px 10px',
      borderRadius: '14px',
    }}>
      {label.toUpperCase()}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9B8A7A', letterSpacing: '0.06em', marginBottom: '4px' }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: '15px', color: '#F4EDE3', lineHeight: 1.5 }}>{value}</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#9B8A7A', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#CDBEAE' }}>{value}</div>
    </div>
  )
}
