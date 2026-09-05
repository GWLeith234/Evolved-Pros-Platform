'use client'

import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import {
  PILLAR_NUMBERS,
  PillarNumberBadge,
  PillarNumberBadgeStyles,
  type PillarNumber,
} from './PillarNumberBadge'

export type KindFilter = 'all' | 'update' | 'question' | 'win' | 'poll'
export type Pillar = PillarNumber
export type SortBy = 'newest' | 'oldest' | 'most_reacted'

// Reduced from 5 → 3 to remove the 1:1 label collision with the
// composer's UPDATE/QUESTION/WIN/POLL tabs. Filter is now clearly a
// "show me" verb (All / Wins / Questions), not a "post type" verb.
const KIND_TABS: Array<{ id: KindFilter; label: string }> = [
  { id: 'all',      label: 'All' },
  { id: 'win',      label: 'Wins' },
  { id: 'question', label: 'Questions' },
]

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
      className="filter-rail-mobile"
      style={{
        position: 'sticky',
        // top:0 because the rail lives inside <main className="overflow-y-auto"> —
        // sticky pins to main's top edge, which is already directly under the
        // 72px TopNav. The previous top:64 was a vestige from a body-scroll era
        // and dropped a 64px gap below the nav at every scroll position.
        top: 0,
        zIndex: 10,
        background: 'var(--filter-rail-bg)',
        borderBottom: '1px solid var(--filter-rail-border)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        maxWidth: '100%',
        minWidth: 0,
      }}
    >
      <style>{`
        .filter-rail-scroll-row {
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          max-width: 100%;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
        }
        .filter-rail-scroll-row::-webkit-scrollbar { display: none; }
        .filter-rail-scroll-row > * { flex-shrink: 0; }
      `}</style>
      <PillarNumberBadgeStyles />

      {/* LEFT — kind filter (small outlined pills, distinct from composer tabs) */}
      <div
        role="tablist"
        className="filter-rail-scroll-row"
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          Show:
        </span>
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
                minHeight: 44,
                padding: '0 14px',
                display: 'inline-flex',
                alignItems: 'center',
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                background: active ? 'var(--text-primary)' : 'transparent',
                color: active ? 'var(--filter-rail-bg)' : 'var(--text-secondary)',
                border: '1px solid var(--filter-rail-border)',
                borderRadius: 999,
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* CENTER — pillar dots */}
      <div className="filter-rail-scroll-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          Pillar:
        </span>
        {PILLAR_NUMBERS.map(p => (
          <PillarNumberBadge
            key={p}
            n={p}
            selected={activePillars.includes(p)}
            onClick={() => togglePillar(p)}
            ariaLabel={`Filter by ${PILLAR_CONFIG[p].label}`}
          />
        ))}
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
              fontSize: 12,
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
            fontSize: 12,
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
            minHeight: 44,
            padding: '8px 12px',
            fontFamily: '"Barlow", sans-serif',
            fontSize: 14,
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
