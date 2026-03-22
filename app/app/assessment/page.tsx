'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { INTAKE_STORAGE_KEY, ESE_STORAGE_KEY, HEXACO_STORAGE_KEY, VALUES_STORAGE_KEY, IDENTITY_STORAGE_KEY, ENTRECOMP_STORAGE_KEY } from '@/lib/assessment'

type BlockStatus = 'completed' | 'available' | 'upcoming'

interface BlockDef {
  number: number
  title: string
  description: string
  href?: string
}

const BLOCKS: BlockDef[] = [
  {
    number: 1,
    title: 'Опыт, связи и ресурсы',
    description: 'Навыки, которые уже оплачены рынком. Контакты, открывающие первые двери. Ресурсы для старта.',
    href: '/assessment/founder-intake',
  },
  {
    number: 2,
    title: 'ESE — предпринимательская самоэффективность',
    description: 'Оценка уверенности по 5 фазам запуска нового направления.',
    href: '/assessment/ese',
  },
  {
    number: 3,
    title: 'HEXACO — личностный профиль',
    description: 'Оценка предпринимательского профиля по 6 личностным факторам.',
    href: '/assessment/hexaco',
  },
  {
    number: 4,
    title: 'Ценности — Schwartz PVQ-RR',
    description: 'Оценка ценностей, которые влияют на стиль бизнеса и границы допустимого.',
    href: '/assessment/values',
  },
  {
    number: 5,
    title: 'Предпринимательская идентичность — Fauchart & Gruber',
    description: 'Какой тип предпринимательской мотивации выражен сильнее: рынок, сообщество или миссия.',
    href: '/assessment/identity',
  },
  {
    number: 6,
    title: 'Компетенции — EntreComp',
    description: 'Оценка предпринимательских компетенций: идеи, действие в неопределённости, этика.',
    href: '/assessment/entrecomp',
  },
]

const STATUS_LABEL: Record<BlockStatus, string> = {
  completed: 'ЗАВЕРШЁН',
  available: 'ДОСТУПЕН',
  upcoming: 'СЛЕДУЮЩИЙ ЭТАП',
}

const STATUS_COLOR: Record<BlockStatus, string> = {
  completed: '#6BA87A',
  available: '#B57A56',
  upcoming: '#6B5D52',
}

export default function AssessmentPage() {
  const [block1Done, setBlock1Done] = useState(false)
  const [block2Done, setBlock2Done] = useState(false)
  const [block3Done, setBlock3Done] = useState(false)
  const [block4Done, setBlock4Done] = useState(false)
  const [block5Done, setBlock5Done] = useState(false)
  const [block6Done, setBlock6Done] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const b1 = localStorage.getItem(INTAKE_STORAGE_KEY)
      const b2 = localStorage.getItem(ESE_STORAGE_KEY)
      const b3 = localStorage.getItem(HEXACO_STORAGE_KEY)
      const b4 = localStorage.getItem(VALUES_STORAGE_KEY)
      const b5 = localStorage.getItem(IDENTITY_STORAGE_KEY)
      const b6 = localStorage.getItem(ENTRECOMP_STORAGE_KEY)
      const hasNum = (raw: string) => Object.values(JSON.parse(raw)).some((v) => typeof v === 'number' && v > 0)
      if (b1) {
        const parsed = JSON.parse(b1)
        setBlock1Done(Object.values(parsed).some((v) => typeof v === 'string' && (v as string).trim().length > 0))
      }
      if (b2) setBlock2Done(hasNum(b2))
      if (b3) setBlock3Done(hasNum(b3))
      if (b4) setBlock4Done(hasNum(b4))
      if (b5) setBlock5Done(hasNum(b5))
      if (b6) setBlock6Done(hasNum(b6))
    } catch {}
    setLoaded(true)
  }, [])

  const getStatus = (blockNumber: number): BlockStatus => {
    if (blockNumber === 1) return block1Done ? 'completed' : 'available'
    if (blockNumber === 2) return block2Done ? 'completed' : block1Done ? 'available' : 'upcoming'
    if (blockNumber === 3) return block3Done ? 'completed' : block2Done ? 'available' : 'upcoming'
    if (blockNumber === 4) return block4Done ? 'completed' : block3Done ? 'available' : 'upcoming'
    if (blockNumber === 5) return block5Done ? 'completed' : block4Done ? 'available' : 'upcoming'
    if (blockNumber === 6) return block6Done ? 'completed' : block5Done ? 'available' : 'upcoming'
    return 'upcoming'
  }

  // CTA logic: always point to the next incomplete block
  const ctaHref = block6Done
    ? '/assessment/overview'
    : block5Done
      ? '/assessment/entrecomp'
      : block4Done
        ? '/assessment/identity'
        : block3Done
          ? '/assessment/values'
          : block2Done
            ? '/assessment/hexaco'
            : block1Done
              ? '/assessment/ese'
              : '/assessment/founder-intake'

  const ctaLabel = block6Done
    ? 'Посмотреть итоги'
    : block5Done
      ? 'Продолжить → Блок 6: EntreComp'
      : block4Done
        ? 'Продолжить → Блок 5: Идентичность'
        : block3Done
          ? 'Продолжить → Блок 4: Ценности'
          : block2Done
            ? 'Продолжить → Блок 3: HEXACO'
            : block1Done
              ? 'Продолжить → Блок 2: ESE'
              : 'Начать диагностику'

  const ctaNote = block6Done
    ? 'Диагностика завершена'
    : block5Done
      ? 'Блок 6 из 6 · ~3 минуты'
      : block4Done
        ? 'Блок 5 из 6 · ~5 минут'
        : block3Done
          ? 'Блок 4 из 6 · ~5 минут'
          : block2Done
            ? 'Блок 3 из 6 · ~7 минут'
            : block1Done
              ? 'Блок 2 из 6 · ~5 минут'
              : 'Блок 1 из 6 · ~10 минут'

  if (!loaded) return null

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
        {BLOCKS.map((block) => {
          const status = getStatus(block.number)
          const isActive = status === 'available' || status === 'completed'
          return (
            <div key={block.number} style={{
              backgroundColor: isActive ? '#1F1A16' : '#141210',
              borderRadius: '20px',
              padding: '20px 24px',
              border: status === 'completed'
                ? '1px solid rgba(107,168,122,0.25)'
                : status === 'available'
                  ? '1px solid rgba(181,122,86,0.30)'
                  : '1px solid rgba(244,237,227,0.05)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '20px',
              opacity: isActive ? 1 : 0.5,
            }}>
              {/* Number badge */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: status === 'completed'
                  ? 'rgba(107,168,122,0.15)'
                  : isActive
                    ? 'rgba(181,122,86,0.18)'
                    : 'rgba(244,237,227,0.05)',
                border: status === 'completed'
                  ? '1px solid rgba(107,168,122,0.4)'
                  : isActive
                    ? '1px solid rgba(181,122,86,0.4)'
                    : '1px solid rgba(244,237,227,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: status === 'completed' ? '#6BA87A' : isActive ? '#D09062' : '#9B8A7A',
                }}>
                  {status === 'completed' ? '✓' : block.number}
                </span>
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: isActive ? '#F4EDE3' : '#9B8A7A' }}>
                    {block.title}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: isActive ? '#CDBEAE' : '#6B5D52', lineHeight: 1.55 }}>
                  {block.description}
                </p>
              </div>

              {/* Status badge */}
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: STATUS_COLOR[status],
                backgroundColor: status === 'completed'
                  ? 'rgba(107,168,122,0.10)'
                  : status === 'available'
                    ? 'rgba(181,122,86,0.12)'
                    : 'rgba(107,93,82,0.15)',
                padding: '4px 12px',
                borderRadius: '12px',
                flexShrink: 0,
                alignSelf: 'center',
                whiteSpace: 'nowrap',
              }}>
                {STATUS_LABEL[status]}
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href={ctaHref} style={{ textDecoration: 'none' }}>
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
            {ctaLabel}
          </button>
        </Link>
        <span style={{ fontSize: '13px', color: '#6B5D52' }}>{ctaNote}</span>
      </div>
    </div>
  )
}
