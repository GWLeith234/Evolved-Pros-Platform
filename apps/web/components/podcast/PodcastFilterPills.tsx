'use client'

import { useState } from 'react'
import type { PodcastPillar } from '@/lib/podcast/transforms'
import { PILLAR_META, PILLAR_ORDER } from '@/lib/podcast/transforms'

const FBC = 'var(--font-barlow-condensed)'

export type FilterKey = PodcastPillar | 'all'
export type SortKey = 'newest' | 'oldest' | 'longest'

const FILTERS: Array<{ key: FilterKey; label: string; color: string }> = [
  { key: 'all', label: 'All episodes', color: 'var(--brand-gold)' },
  ...PILLAR_ORDER.map(p => ({ key: p as FilterKey, label: PILLAR_META[p].label, color: PILLAR_META[p].color })),
]

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'newest',  label: 'Newest first' },
  { key: 'oldest',  label: 'Oldest first' },
  { key: 'longest', label: 'Longest first' },
]

interface PodcastFilterPillsProps {
  filter: FilterKey
  sort: SortKey
  onFilterChange: (f: FilterKey) => void
  onSortChange: (s: SortKey) => void
}

function ChevronDown() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
    >
      <polyline points="2 4 6 8 10 4" />
    </svg>
  )
}

export function PodcastFilterPills({ filter, sort, onFilterChange, onSortChange }: PodcastFilterPillsProps) {
  const [sortOpen, setSortOpen] = useState(false)
  const activeSort = SORTS.find(s => s.key === sort) ?? SORTS[0]

  return (
    <div className="podcast-filter-bar" style={{ marginBottom: 32 }}>
      {/* Pillar pills — horizontal scroll on mobile so Sort never collides */}
      <div
        className="podcast-filter-pills"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 4,
          marginBottom: 12,
          scrollbarWidth: 'none',
        }}
      >
        {FILTERS.map(f => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilterChange(f.key)}
              style={{
                minHeight: 40,
                flex: '0 0 auto',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 12px',
                background: active ? f.color : 'transparent',
                color: active ? 'var(--bg-page)' : f.color,
                border: `1px solid ${active ? f.color : `color-mix(in srgb, ${f.color} 40%, transparent)`}`,
                borderRadius: 0,
                fontFamily: FBC,
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 120ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Sort — own row so Next Event / pills never obscure it */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, position: 'relative' }}>
        <span
          style={{
            fontFamily: FBC,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--podcast-text-4)',
          }}
        >
          Sort
        </span>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setSortOpen(o => !o)}
            onBlur={() => setTimeout(() => setSortOpen(false), 120)}
            aria-expanded={sortOpen}
            aria-haspopup="listbox"
            style={{
              minHeight: 40,
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0 32px 0 12px',
              background: 'var(--podcast-bg-surface)',
              color: 'var(--podcast-text-strong)',
              border: '1px solid var(--podcast-border-strong)',
              borderRadius: 0,
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              position: 'relative',
              minWidth: 148,
              textAlign: 'left',
            }}
          >
            {activeSort.label}
            <ChevronDown />
          </button>
          {sortOpen && (
            <ul
              role="listbox"
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                minWidth: 200,
                background: 'var(--podcast-bg-surface)',
                border: '1px solid var(--podcast-border-strong)',
                zIndex: 60,
                boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
              }}
            >
              {SORTS.map(s => {
                const active = s.key === sort
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        onSortChange(s.key)
                        setSortOpen(false)
                      }}
                      style={{
                        width: '100%',
                        minHeight: 44,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 14px',
                        background: active ? 'var(--podcast-bg-elevated)' : 'transparent',
                        color: 'var(--podcast-text-strong)',
                        border: 'none',
                        fontFamily: FBC,
                        fontWeight: 700,
                        fontSize: 12,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {s.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <style>{`
        .podcast-filter-pills::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
