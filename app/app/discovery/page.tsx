'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  painAdapter,
  type PainListItem, type PainDetailItem, type PersonalPainMatchItem, type FitLabel,
} from '@/lib/pain-registry'

const STATUS_LABEL: Record<string, string> = {
  new: 'Новый', validated: 'Подтверждён', high_pain: 'Быстрый рост', archived: 'Архив',
}
const STATUS_COLOR: Record<string, string> = {
  new: '#9B8A7A', validated: '#6BA87A', high_pain: '#C47A3A', archived: '#6B5D52',
}
const STATUS_BG: Record<string, string> = {
  new: 'rgba(155,138,122,0.10)', validated: 'rgba(107,168,122,0.12)',
  high_pain: 'rgba(196,122,58,0.14)', archived: 'rgba(107,93,82,0.10)',
}

const FIT_LABEL: Record<FitLabel, string> = { high: 'Высокий fit', medium: 'Средний fit', low: 'Низкий fit' }
const FIT_SHORT: Record<FitLabel, string> = { high: 'HIGH', medium: 'MED', low: 'LOW' }
const FIT_COLOR: Record<FitLabel, string> = { high: '#6BA87A', medium: '#C47A3A', low: '#9B8A7A' }
const FIT_BG: Record<FitLabel, string> = {
  high: 'rgba(107,168,122,0.12)', medium: 'rgba(196,122,58,0.14)', low: 'rgba(155,138,122,0.10)',
}

const SOURCE_ABBR: Record<string, string> = {
  telegram: 'TG', vk: 'VK', forum: 'FR', otzovik: 'OZ',
  минцифры: 'МЦ', cnews: 'CN', skolkovo: 'SK', rbc: 'RBC',
  фнс: 'ФНС', тинькофф: 'TCS', hh: 'HH', skillbox: 'SB',
  positive_tech: 'PT', bi_zone: 'BZ', data_insight: 'DI', vc_ru: 'VC',
  mckinsey_health: 'MC', раэк: 'РЭ', сдэк: 'СД', superjob: 'SJ',
}
const PAGE_SIZE = 10

// ── Small shared components ───────────────────────────────────────────────────

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '3px', backgroundColor: 'rgba(244,237,227,0.08)', borderRadius: '2px' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#B57A56', borderRadius: '2px' }} />
      </div>
      <span style={{ fontSize: '12px', color: '#F4EDE3', minWidth: '26px', textAlign: 'right' }}>
        {score.toFixed(1)}
      </span>
    </div>
  )
}

function SourceBadges({ sources }: { sources: string[] }) {
  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {sources.map(s => (
        <span key={s} style={{
          fontSize: '10px', fontWeight: 600, color: '#6B5D52',
          backgroundColor: 'rgba(107,93,82,0.15)', borderRadius: '5px',
          padding: '2px 6px', letterSpacing: '0.04em',
        }}>
          {SOURCE_ABBR[s] ?? s.toUpperCase()}
        </span>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 600, color: STATUS_COLOR[status] ?? '#9B8A7A',
      backgroundColor: STATUS_BG[status] ?? 'rgba(155,138,122,0.10)',
      padding: '3px 9px', borderRadius: '8px', whiteSpace: 'nowrap',
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

// ── Detail drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({
  item, match, onClose,
}: {
  item: PainDetailItem
  match: PersonalPainMatchItem | null
  onClose: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '10px', color: '#6B5D52', letterSpacing: '0.07em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.65 }}>{value}</div>
    </div>
  )

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 100 }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '460px', maxWidth: '100vw',
        backgroundColor: '#141210', borderLeft: '1px solid rgba(244,237,227,0.08)',
        zIndex: 101, overflowY: 'auto', padding: '24px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: '#6B5D52', letterSpacing: '0.07em', marginBottom: '6px' }}>
              {item.vertical} · {item.segment}
            </div>
            <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#F4EDE3', lineHeight: 1.3, margin: 0 }}>
              {item.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#6B5D52', fontSize: '22px',
              cursor: 'pointer', padding: '2px 6px', lineHeight: 1, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
          <StatusBadge status={item.status} />
          {match && (
            <span style={{
              fontSize: '10px', fontWeight: 600, color: FIT_COLOR[match.fit_label],
              backgroundColor: FIT_BG[match.fit_label], padding: '3px 9px', borderRadius: '8px',
            }}>
              {FIT_LABEL[match.fit_label]}
            </span>
          )}
          <span style={{ fontSize: '11px', color: '#6B5D52', marginLeft: 'auto' }}>
            {new Date(item.last_seen_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
          </span>
        </div>

        {/* Score breakdown */}
        <div style={{
          backgroundColor: '#1A1613', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px',
          border: '1px solid rgba(244,237,227,0.06)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              ['Рейтинг тренда', item.market_pain_score],
              ['Структурная сила', item.score_breakdown.structural_strength],
              ['Спрос', item.score_breakdown.demand_signal],
              ['Устойчивость', item.score_breakdown.longevity],
            ].map(([label, val]) => (
              <div key={label as string}>
                <div style={{ fontSize: '10px', color: '#6B5D52', marginBottom: '4px' }}>{label}</div>
                <ScoreBar score={val as number} />
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '14px', color: '#CDBEAE', lineHeight: 1.7, margin: '0 0 20px' }}>
          {item.full_description}
        </p>

        <Field label="ГОРИЗОНТ И ОХВАТ" value={item.target_who} />
        <Field label="ПОЧЕМУ РАСТЁТ" value={item.context} />
        {item.workaround && <Field label="ТЕКУЩИЕ РЕШЕНИЯ" value={item.workaround} />}
        {item.consequences && <Field label="ВОЗМОЖНОСТИ" value={item.consequences} />}

        {/* Evidence */}
        <div style={{
          backgroundColor: '#1A1613', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px',
          border: '1px solid rgba(244,237,227,0.06)',
        }}>
          <div style={{ fontSize: '10px', color: '#6B5D52', letterSpacing: '0.07em', marginBottom: '6px' }}>
            ИСТОЧНИКИ
          </div>
          <div style={{ fontSize: '13px', color: '#9B8A7A', lineHeight: 1.6, marginBottom: '10px' }}>
            {item.evidence_summary}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#B57A56', fontWeight: 600 }}>
              {item.evidence_count} ист.
            </span>
            <SourceBadges sources={item.source_types} />
          </div>
        </div>

        {/* Personal match */}
        {match && (
          <div style={{
            backgroundColor: 'rgba(107,168,122,0.05)', borderRadius: '12px', padding: '14px 16px',
            border: '1px solid rgba(107,168,122,0.12)', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '10px', color: '#6B5D52', letterSpacing: '0.07em', marginBottom: '8px' }}>
              СООТВЕТСТВИЕ ПРОФИЛЮ
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                fontSize: '10px', fontWeight: 600, color: FIT_COLOR[match.fit_label],
                backgroundColor: FIT_BG[match.fit_label], padding: '3px 9px', borderRadius: '7px',
              }}>
                {FIT_LABEL[match.fit_label]}
              </span>
              <span style={{ fontSize: '12px', color: '#6B5D52' }}>
                fit {match.fit_score.toFixed(1)}/10
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#CDBEAE', lineHeight: 1.6 }}>
              {match.fit_reason_short}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{
          display: 'flex', gap: '8px', paddingTop: '16px',
          borderTop: '1px solid rgba(244,237,227,0.06)',
        }}>
          <button style={{
            flex: 1, padding: '11px', backgroundColor: '#B57A56', color: '#0B0908',
            border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>
            Сохранить
          </button>
          <button style={{
            padding: '11px 14px', backgroundColor: 'transparent', color: '#9B8A7A',
            border: '1px solid rgba(244,237,227,0.10)', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
          }}>
            Скрыть
          </button>
          <button style={{
            padding: '11px 14px', backgroundColor: 'transparent', color: '#9B8A7A',
            border: '1px solid rgba(244,237,227,0.10)', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
          }}>
            → Возможности
          </button>
        </div>
      </div>
    </>
  )
}

// ── Pain row (left column) ────────────────────────────────────────────────────

function PainRow({ item, selected, onClick }: {
  item: PainListItem; selected: boolean; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const bg = selected ? '#1F1A16' : hovered ? '#18150F' : 'transparent'
  const border = selected ? '1px solid rgba(181,122,86,0.25)' : '1px solid transparent'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: bg, border, cursor: 'pointer', transition: 'background-color 0.10s ease' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '5px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '10px', color: '#6B5D52', marginBottom: '2px' }}>
            {item.vertical} · {item.segment}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#F4EDE3', lineHeight: 1.3 }}>
            {item.title}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#B57A56', lineHeight: 1 }}>
            {item.market_pain_score.toFixed(1)}
          </div>
          <div style={{ fontSize: '9px', color: '#6B5D52', marginTop: '1px' }}>рейтинг</div>
        </div>
      </div>

      <div style={{ fontSize: '13px', color: '#9B8A7A', lineHeight: 1.5, marginBottom: '8px' }}>
        {item.short_description}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <StatusBadge status={item.status} />
        <span style={{ fontSize: '11px', color: '#6B5D52' }}>{item.evidence_count} ист.</span>
        <SourceBadges sources={item.source_types} />
        <span style={{ fontSize: '10px', color: '#6B5D52', marginLeft: 'auto' }}>
          {new Date(item.last_seen_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  )
}

// ── Match row (right column) ──────────────────────────────────────────────────

function MatchRow({ item, selected, onClick }: {
  item: PersonalPainMatchItem; selected: boolean; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const bg = selected ? '#1F1A16' : hovered ? '#18150F' : 'transparent'
  const border = selected ? '1px solid rgba(107,168,122,0.25)' : '1px solid transparent'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: bg, border, cursor: 'pointer', transition: 'background-color 0.10s ease' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#F4EDE3', lineHeight: 1.3, flex: 1 }}>
          {item.title}
        </div>
        <span style={{
          fontSize: '9px', fontWeight: 700, color: FIT_COLOR[item.fit_label],
          backgroundColor: FIT_BG[item.fit_label], padding: '2px 7px', borderRadius: '6px', flexShrink: 0,
        }}>
          {FIT_SHORT[item.fit_label]}
        </span>
      </div>
      <div style={{ fontSize: '12px', color: '#9B8A7A', lineHeight: 1.5, marginBottom: '4px' }}>
        {item.fit_reason_short}
      </div>
      <div style={{ fontSize: '10px', color: '#6B5D52' }}>
        fit {item.fit_score.toFixed(1)} · тренд {item.market_pain_score.toFixed(1)}
      </div>
    </div>
  )
}

// ── Main content (requires Suspense for useSearchParams) ──────────────────────

function RequestPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Data state ──────────────────────────────────────────────
  const [allItems, setAllItems]     = useState<PainListItem[]>([])
  const [matches, setMatches]       = useState<PersonalPainMatchItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [dataError, setDataError]   = useState<string | null>(null)

  // ── Detail drawer state ─────────────────────────────────────
  const [detailItem, setDetailItem]   = useState<PainDetailItem | null>(null)
  const [detailMatch, setDetailMatch] = useState<PersonalPainMatchItem | null>(null)

  // ── Load data via adapter ───────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setDataError(null)
    Promise.all([painAdapter.listPains(), painAdapter.getPersonalMatches()])
      .then(([pains, personalMatches]) => {
        if (cancelled) return
        setAllItems(pains)
        setMatches(personalMatches)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setDataError('Не удалось загрузить данные')
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // ── Verticals derived from loaded data ─────────────────────
  const verticals = useMemo(() =>
    [...new Set(allItems.map(p => p.vertical))].sort()
  , [allItems])

  // ── URL params ──────────────────────────────────────────────
  const q        = searchParams.get('q')         ?? ''
  const vertical = searchParams.get('vertical')  ?? ''
  const status   = searchParams.get('status')    ?? ''
  const sort     = searchParams.get('sort')      ?? 'score'
  const page     = parseInt(searchParams.get('page') ?? '1', 10)

  const setParam = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (value) p.set(key, value); else p.delete(key)
    if (key !== 'page') p.delete('page')
    router.replace(`?${p.toString()}`, { scroll: false })
  }, [router, searchParams])

  const clearFilters = () => router.replace('?', { scroll: false })
  const hasFilters = !!(q || vertical || status)

  // ── Open detail drawer via adapter ─────────────────────────
  const selectItem = useCallback(async (id: string) => {
    if (detailItem?.pain_id === id) { setDetailItem(null); setDetailMatch(null); return }
    const item = await painAdapter.getPainDetail(id)
    if (!item) return
    setDetailItem(item)
    setDetailMatch(matches.find(m => m.pain_id === id) ?? null)
  }, [detailItem, matches])

  // ── Filter + sort ───────────────────────────────────────────
  const filtered = allItems.filter(item => {
    if (q) {
      const lq = q.toLowerCase()
      const hit = item.title.toLowerCase().includes(lq) ||
                  item.segment.toLowerCase().includes(lq) ||
                  item.short_description.toLowerCase().includes(lq) ||
                  item.tags.some(t => t.toLowerCase().includes(lq))
      if (!hit) return false
    }
    if (vertical && item.vertical !== vertical) return false
    if (status && item.status !== status) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'evidence') return b.evidence_count - a.evidence_count
    if (sort === 'fresh') return new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime()
    return b.market_pain_score - a.market_pain_score
  })

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const paginated = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const hasProfile = matches.length > 0

  // ── Loading / error states ─────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#6B5D52' }}>Загружаем мегатренды...</div>
      </div>
    )
  }

  if (dataError) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#C47A3A', marginBottom: '12px' }}>{dataError}</div>
        <button
          onClick={() => window.location.reload()}
          style={{ background: 'none', border: 'none', color: '#B57A56', fontSize: '13px', cursor: 'pointer' }}
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', color: '#9B8A7A', letterSpacing: '0.07em', marginBottom: '8px' }}>
          МЕГАТРЕНДЫ РЫНКА
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#F4EDE3', margin: 0 }}>
          Запрос
        </h1>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center',
        marginBottom: '20px',
      }}>
        <input
          value={q}
          onChange={e => setParam('q', e.target.value)}
          placeholder="Поиск по названию, сегменту, тегам..."
          style={{
            flex: '1 1 220px', minWidth: '180px',
            backgroundColor: '#1A1613', border: '1px solid rgba(244,237,227,0.09)',
            borderRadius: '10px', padding: '9px 14px', color: '#F4EDE3',
            fontSize: '13px', fontFamily: 'inherit', outline: 'none',
          }}
        />

        <select
          value={vertical}
          onChange={e => setParam('vertical', e.target.value)}
          style={{
            backgroundColor: '#1A1613', border: '1px solid rgba(244,237,227,0.09)',
            borderRadius: '10px', padding: '9px 12px',
            color: vertical ? '#F4EDE3' : '#6B5D52',
            fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">Все вертикали</option>
          {verticals.map(v => <option key={v} value={v}>{v}</option>)}
        </select>

        <select
          value={status}
          onChange={e => setParam('status', e.target.value)}
          style={{
            backgroundColor: '#1A1613', border: '1px solid rgba(244,237,227,0.09)',
            borderRadius: '10px', padding: '9px 12px',
            color: status ? '#F4EDE3' : '#6B5D52',
            fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">Все статусы</option>
          <option value="new">Новый</option>
          <option value="validated">Подтверждён</option>
          <option value="high_pain">Быстрый рост</option>
        </select>

        <select
          value={sort}
          onChange={e => setParam('sort', e.target.value)}
          style={{
            backgroundColor: '#1A1613', border: '1px solid rgba(244,237,227,0.09)',
            borderRadius: '10px', padding: '9px 12px', color: '#F4EDE3',
            fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="score">По рейтингу тренда</option>
          <option value="evidence">По числу источников</option>
          <option value="fresh">По свежести</option>
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              backgroundColor: 'transparent', border: '1px solid rgba(244,237,227,0.09)',
              borderRadius: '10px', padding: '9px 14px', color: '#9B8A7A',
              fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Сбросить
          </button>
        )}
      </div>

      {/* 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'start' }}>

        {/* ── Left: full registry ──────────────────────────────── */}
        <div>
          {/* Count */}
          <div style={{ fontSize: '12px', color: '#6B5D52', marginBottom: '10px' }}>
            {total === allItems.length ? `${total} трендов` : `${total} из ${allItems.length}`}
          </div>

          {paginated.length === 0 ? (
            <div style={{
              padding: '48px 24px', textAlign: 'center',
              border: '1px dashed rgba(244,237,227,0.07)', borderRadius: '14px',
            }}>
              <div style={{ fontSize: '14px', color: '#6B5D52', marginBottom: '10px' }}>
                {hasFilters ? 'Ничего не найдено' : 'Нет данных'}
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  style={{ background: 'none', border: 'none', color: '#B57A56', fontSize: '13px', cursor: 'pointer' }}
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {paginated.map(item => (
                <PainRow
                  key={item.pain_id}
                  item={item}
                  selected={detailItem?.pain_id === item.pain_id}
                  onClick={() => selectItem(item.pain_id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
              <button
                disabled={safePage <= 1}
                onClick={() => setParam('page', String(safePage - 1))}
                style={{
                  backgroundColor: 'transparent', border: '1px solid rgba(244,237,227,0.09)',
                  borderRadius: '9px', padding: '8px 14px',
                  color: safePage <= 1 ? '#6B5D52' : '#9B8A7A',
                  fontSize: '13px', cursor: safePage <= 1 ? 'default' : 'pointer', fontFamily: 'inherit',
                }}
              >
                ← Назад
              </button>
              <span style={{ fontSize: '12px', color: '#6B5D52' }}>
                {safePage} / {totalPages}
              </span>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setParam('page', String(safePage + 1))}
                style={{
                  backgroundColor: 'transparent', border: '1px solid rgba(244,237,227,0.09)',
                  borderRadius: '9px', padding: '8px 14px',
                  color: safePage >= totalPages ? '#6B5D52' : '#9B8A7A',
                  fontSize: '13px', cursor: safePage >= totalPages ? 'default' : 'pointer', fontFamily: 'inherit',
                }}
              >
                Вперёд →
              </button>
            </div>
          )}
        </div>

        {/* ── Right: personal shortlist ────────────────────────── */}
        <div style={{
          backgroundColor: '#141210',
          border: '1px solid rgba(244,237,227,0.07)',
          borderRadius: '14px',
          padding: '14px',
          position: 'sticky',
          top: '72px',
        }}>
          <div style={{ fontSize: '10px', color: '#9B8A7A', letterSpacing: '0.07em', marginBottom: '12px' }}>
            ПОДХОДИТ МНЕ
          </div>

          {!hasProfile ? (
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#6B5D52', lineHeight: 1.6 }}>
                Пока нет данных под ваш профиль
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {matches.map(item => (
                <MatchRow
                  key={item.pain_id}
                  item={item}
                  selected={detailItem?.pain_id === item.pain_id}
                  onClick={() => selectItem(item.pain_id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {detailItem && (
        <DetailDrawer
          item={detailItem}
          match={detailMatch}
          onClose={() => { setDetailItem(null); setDetailMatch(null) }}
        />
      )}
    </div>
  )
}

export default function RequestPage() {
  return (
    <Suspense fallback={null}>
      <RequestPageContent />
    </Suspense>
  )
}
