'use client'

import { useState } from 'react'
import type { PodcastPillar } from '@/lib/podcast/transforms'

const FBC = 'Barlow Condensed, sans-serif'

export type FilterKey = PodcastPillar | 'all'
export type SortKey = 'newest' | 'oldest' | 'longest'

const FILTERS: Array<{ key: FilterKey; label: string; color: string }> = [
  { key: 'all',              label: 'All episodes',     color: '#C9A84C' },
  { key: 'foundation',       label: 'Foundation',       color: '#FFA538' },
  { key: 'identity',         label: 'Identity',         color: '#A78BFA' },
  { key: 'mental-toughness', label: 'Mental Toughness', color: '#F87171' },
  { key: 'strategy',         label: 'Strategy',         color: '#60A5FA' },
  { key: 'accountability',   label: 'Accountability',   color: '#C9A84C' },
  { key: 'execution',        label: 'Execution',        color: '#0ABFA3' },
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

function withAlpha(hex: string, alphaHex: string): string {
  return `${hex}${alphaHex}`
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 32,
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
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0 14px',
              background: active ? f.color : 'transparent',
              color: active ? '#0A0F18' : f.color,
              border: `1px solid ${active ? f.color : withAlpha(f.color, '66')}`,
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            {f.label}
          </button>
        )
      })}
      <span style={{ flex: 1 }} />
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        <span
          style={{
            fontFamily: FBC,
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.32em',
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
            style={{
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0 32px 0 12px',
              background: 'var(--podcast-bg-surface)',
              color: 'var(--podcast-text-strong)',
              border: '1px solid var(--podcast-border-strong)',
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              position: 'relative',
              minWidth: 160,
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
                boxShadow: '0 12px 32px -12px rgba(0,0,0,0.45)',
                zIndex: 10,
              }}
            >
              {SORTS.map(s => {
                const active = s.key === sort
                return (
                  <li key={s.key}>
                    <button
                      type="button"
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
                        letterSpacing: '0.18em',
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
    </div>
  )
}
