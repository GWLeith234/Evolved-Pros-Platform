'use client'

import { useState } from 'react'
import type { MediaFilterCategory } from '@/lib/media/filters'

export const CATEGORY_COLORS: Record<string, string> = {
  Foundation: '#FFA538',
  Identity: '#A78BFA',
  'Mental Toughness': '#F87171',
  Strategy: '#3D6BB8',
  Accountability: '#C9A84C',
  Execution: '#0A9980',
}

const ALL_LABEL = 'All'

interface CategoryPillsProps {
  initialActive?: string
  onSelect?: (category: string) => void
  /** Only pillars that have at least one published story. */
  categories?: ReadonlyArray<MediaFilterCategory>
}

export function CategoryPills({
  initialActive = ALL_LABEL,
  onSelect,
  categories = [],
}: CategoryPillsProps) {
  const [active, setActive] = useState<string>(initialActive)

  const handleSelect = (category: string) => {
    setActive(category)
    onSelect?.(category)
  }

  if (categories.length === 0) return null

  return (
    <nav
      aria-label="Filter stories by pillar"
      className="ed-category-pills"
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '20px 16px 4px',
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      <Pill
        label={ALL_LABEL}
        color="#112535"
        active={active === ALL_LABEL}
        onClick={() => handleSelect(ALL_LABEL)}
      />
      {categories.map(category => (
        <Pill
          key={category.slug}
          label={category.label}
          color={category.color || CATEGORY_COLORS[category.label] || '#112535'}
          active={active === category.label}
          onClick={() => handleSelect(category.label)}
        />
      ))}
      <style>{`
        .ed-category-pills::-webkit-scrollbar { display: none; }
        @media (max-width: 639px) {
          .ed-category-pills { padding-right: 16px !important; max-width: 100% !important; }
        }
        @media (min-width: 640px) {
          .ed-category-pills { flex-wrap: wrap !important; overflow-x: visible !important; padding: 20px 24px 0 !important; }
        }
      `}</style>
    </nav>
  )
}

function Pill({
  label,
  color,
  active,
  onClick,
}: {
  label: string
  color: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        minHeight: 44,
        padding: '0 12px',
        background: active ? '#112535' : '#FFFFFF',
        border: `1px solid ${active ? '#112535' : '#E5E0D8'}`,
        color: active ? '#FFFFFF' : '#374151',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        borderRadius: 0,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          background: active ? '#FFFFFF' : color,
          borderRadius: '50%',
          flexShrink: 0,
        }}
      />
      {label}
    </button>
  )
}
