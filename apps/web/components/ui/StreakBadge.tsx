'use client'

/**
 * Shared streak chip used by Daily Pulse and scoreboard surfaces.
 * Micro-interaction: optional bump animation on increment (Sprint 3).
 */

import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface StreakBadgeProps {
  days: number
  /** Fire bump animation (e.g. after a check-in). */
  bump?: boolean
  className?: string
  style?: React.CSSProperties
}

const GOLD = '#C9A84C'

export function StreakBadge({ days, bump, className = '', style }: StreakBadgeProps) {
  const reduced = useReducedMotion()
  const active = days > 0

  return (
    <span
      className={`ep-streak-badge${bump && !reduced ? ' ep-streak-badge--bump' : ''} ${className}`.trim()}
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontFamily: 'var(--font-condensed), sans-serif',
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: '0.08em',
        padding: '2px 7px',
        borderRadius: 0,
        background: active ? 'rgba(201,168,76,0.14)' : 'var(--bg-elevated)',
        color: active ? GOLD : 'var(--text-tertiary)',
        ...style,
      }}
      aria-label={active ? `${days} day streak` : 'No active streak'}
    >
      {active && (
        <span aria-hidden="true" style={{ fontSize: 9, lineHeight: 1 }}>
          🔥
        </span>
      )}
      {days}D
    </span>
  )
}
