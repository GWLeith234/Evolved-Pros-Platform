'use client'

import { PILLAR_CONFIG } from '@/lib/pillar-colors'

export type KindFilter = 'all' | 'update' | 'question' | 'win' | 'poll'
export type Pillar = 1 | 2 | 3 | 4 | 5 | 6
export type SortBy = 'newest' | 'oldest' | 'most_reacted'

const KIND_TABS: Array<{ id: KindFilter; label: string }> = [
  { id: 'all',      label: 'All' },
  { id: 'update',   label: 'Update' },
  { id: 'question', label: 'Question' },
  { id: 'win',      label: 'Win' },
  { id: 'poll',     label: 'Poll' },
]

const PILLARS: Pillar[] = [1, 2, 3, 4, 5, 6]

const SORT_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: 'newest',       label: 'Newest' },
  { value: 'oldest',       label: 'Oldest' },
  { value: 'most_reacted', label: 'Most reacted' },
]

interface FilterRailProps {
  activeKind: KindFilter
  activePillars: Pillar[]
  sortBy: SortBy
  onChangeKind: (k: KindFilter) => void
  onChangePillars: (p: Pillar[]) => void
  onChangeSort: (s: SortBy) => void
}

export function FilterRail({
  activeKind,
  activePillars,
  sortBy,
  onChangeKind,
  onChangePillars,
  onChangeSort,
}: FilterRailProps) {
  const togglePillar = (p: Pillar) => {
    if (activePillars.includes(p)) {
      onChangePillars(activePillars.filter(x => x !== p))
    } else {
      onChangePillars([...activePillars, p])
    }
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 64,
        zIndex: 10,
        background: 'var(--filter-rail-bg)',
        borderBottom: '1px solid var(--filter-rail-border)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap',
      }}
    >
      {/* LEFT — kind tabs (segmented) */}
      <div role="tablist" style={{ display: 'flex', alignItems: 'stretch' }}>
        {KIND_TABS.map(tab => {
          const active = tab.id === activeKind
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChangeKind(tab.id)}
              style={{
                padding: '8px 16px',
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 13,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                background: active ? 'var(--filter-rail-active-bg)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderBottom: active ? '2px solid var(--text-primary)' : '2px solid transparent',
                marginBottom: -1,
                borderRadius: 0,
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.background = 'transparent'
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* CENTER — pillar dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          Pillar:
        </span>
        {PILLARS.map(p => {
          const color = PILLAR_CONFIG[p].color
          const active = activePillars.includes(p)
          return (
            <button
              key={p}
              type="button"
              onClick={() => togglePillar(p)}
              aria-pressed={active}
              aria-label={`Filter by ${PILLAR_CONFIG[p].label}`}
              title={PILLAR_CONFIG[p].label}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: color,
                border: `2px solid ${active ? color : 'transparent'}`,
                opacity: active ? 1 : 0.4,
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 11,
                color: '#0A0F18',
                transition: 'opacity 120ms ease, border-color 120ms ease',
              }}
            >
              {p}
            </button>
          )
        })}
        {activePillars.length > 0 && (
          <button
            type="button"
            onClick={() => onChangePillars([])}
            style={{
              marginLeft: 4,
              padding: '4px 8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
            }}
          >
            × Clear
          </button>
        )}
      </div>

      {/* RIGHT — sort dropdown */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          Sort:
        </span>
        <select
          value={sortBy}
          onChange={e => onChangeSort(e.target.value as SortBy)}
          style={{
            padding: '6px 10px',
            fontFamily: '"Barlow", sans-serif',
            fontSize: 11,
            background: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid var(--filter-rail-border)',
            borderRadius: 0,
            cursor: 'pointer',
          }}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value} style={{ background: 'var(--filter-rail-bg)' }}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
