'use client'

import { PILLAR_CONFIG } from '@/lib/pillar-colors'

export type PillarNumber = 1 | 2 | 3 | 4 | 5 | 6

export const PILLAR_NUMBERS: PillarNumber[] = [1, 2, 3, 4, 5, 6]

// Same short labels as the Community feed PILLAR filter (and the mobile
// screenshot). Kept here so compose tagging and the filter cannot drift.
export const PILLAR_ABBREV: Record<PillarNumber, string> = {
  1: 'FOUND.',
  2: 'IDENT.',
  3: 'MENTAL',
  4: 'STRAT.',
  5: 'ACCT.',
  6: 'EXEC.',
}

/**
 * `mobile` matches the feed filter: abbrev is hidden at sm+ so the rail
 * stays compact. `always` is for compose tagging, where the short name
 * must stay visible next to the number.
 */
export type PillarAbbrevMode = 'mobile' | 'always'

const BADGE_STYLES = `
  .pillar-number-badge {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .pillar-number-badge-row {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
    max-width: 100%;
    min-width: 0;
    -webkit-overflow-scrolling: touch;
  }
  .pillar-number-badge-row::-webkit-scrollbar { display: none; }
  .pillar-number-badge-row > * { flex-shrink: 0; }
  .pillar-number-badge-abbrev {
    display: none;
    font-family: "Barlow Condensed", sans-serif;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-tertiary);
    line-height: 1;
  }
  @media (max-width: 639px) {
    .pillar-number-badge-abbrev { display: block; }
  }
  .pillar-number-badge--abbrev-always .pillar-number-badge-abbrev {
    display: block;
  }
`

export function PillarNumberBadgeStyles() {
  return <style>{BADGE_STYLES}</style>
}

interface PillarNumberBadgeProps {
  n: PillarNumber
  selected: boolean
  onClick: () => void
  ariaLabel: string
  abbrev?: PillarAbbrevMode
}

export function PillarNumberBadge({
  n,
  selected,
  onClick,
  ariaLabel,
  abbrev = 'mobile',
}: PillarNumberBadgeProps) {
  const color = PILLAR_CONFIG[n].color
  const className = abbrev === 'always'
    ? 'pillar-number-badge pillar-number-badge--abbrev-always'
    : 'pillar-number-badge'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      title={PILLAR_CONFIG[n].label}
      className={className}
    >
      <span
        aria-hidden="true"
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: color,
          border: `2px solid ${selected ? color : 'transparent'}`,
          opacity: selected ? 1 : 0.4,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 12,
          color: '#0A0F18',
          transition: 'opacity 120ms ease, border-color 120ms ease',
        }}
      >
        {n}
      </span>
      <span className="pillar-number-badge-abbrev" aria-hidden="true">
        {PILLAR_ABBREV[n]}
      </span>
    </button>
  )
}
