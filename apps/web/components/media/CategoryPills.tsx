'use client'

import { useState } from 'react'

// Source: _design_refs/platform-handoff-2026-04-29/components/media/media-data.jsx
// First 3 categories are editorial sections (media_stories.section values land
// in MR2). Last 6 align with the existing EVOLVED pillar slugs.
export const CATEGORY_COLORS: Record<string, string> = {
  Revenue: '#C9302A',
  AI: '#1B2A4A',
  Leadership: '#8B6A00',
  Foundation: '#FFA538',
  Identity: '#A78BFA',
  'Mental Toughness': '#F87171',
  Strategy: '#3D6BB8',
  Accountability: '#C9A84C',
  Execution: '#0A9980',
}

const ALL_LABEL = 'All'

const CATEGORIES: ReadonlyArray<string> = [
  'Revenue',
  'AI',
  'Leadership',
  'Foundation',
  'Identity',
  'Mental Toughness',
  'Strategy',
  'Accountability',
  'Execution',
]

interface CategoryPillsProps {
  initialActive?: string
  onSelect?: (category: string) => void
}

export function CategoryPills({ initialActive = ALL_LABEL, onSelect }: CategoryPillsProps) {
  const [active, setActive] = useState<string>(initialActive)

  const handleSelect = (category: string) => {
    setActive(category)
    onSelect?.(category)
  }

  return (
    <nav
      aria-label="Filter stories by category"
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '20px 24px 0',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Pill
        label={ALL_LABEL}
        color="var(--ed-text, #1B2A4A)"
        active={active === ALL_LABEL}
        onClick={() => handleSelect(ALL_LABEL)}
      />
      {CATEGORIES.map(category => (
        <Pill
          key={category}
          label={category}
          color={CATEGORY_COLORS[category] ?? 'var(--ed-text, #1B2A4A)'}
          active={active === category}
          onClick={() => handleSelect(category)}
        />
      ))}
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
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        background: active ? color : 'transparent',
        border: `1px solid ${active ? color : 'var(--ed-border, #E0D8CC)'}`,
        color: active ? '#fff' : 'var(--ed-text, #1B2A4A)',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        borderRadius: 0,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          background: active ? '#fff' : color,
          borderRadius: '50%',
          flexShrink: 0,
        }}
      />
      {label}
    </button>
  )
}
