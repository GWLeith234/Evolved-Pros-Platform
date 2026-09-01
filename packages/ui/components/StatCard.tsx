import React from 'react'
import { getPillarColor } from '../tokens/index'

type DeltaType = 'up' | 'neutral'
export type Accent = 'red' | 'teal' | 'navy' | 'gold' | 'violet'

export interface StatCardProps {
  value: string | number
  label: string
  /** Small qualifier shown under the label (e.g. "By points"). */
  hint?: string
  delta?: string
  deltaType?: DeltaType
  accent?: Accent
  /** When set, the accent bar uses the pillar color (overrides `accent`). */
  pillar?: number | string | null
  className?: string
}

const accentColors: Record<Accent, string> = {
  red:    '#ef0e30',
  teal:   '#68a2b9',
  navy:   '#1b3c5a',
  gold:   '#c9a84c',
  violet: '#A78BFA',
}

const deltaBadgeStyles: Record<DeltaType, string> = {
  up:      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  neutral: 'bg-[var(--bg-elevated)] text-tertiary',
}

const deltaIcons: Record<DeltaType, string> = {
  up:      '↑',
  neutral: '',
}

export function StatCard({
  value,
  label,
  hint,
  delta,
  deltaType = 'neutral',
  accent = 'teal',
  pillar,
  className = '',
}: StatCardProps) {
  const barColor = pillar != null ? getPillarColor(pillar) : accentColors[accent]
  return (
    <div
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
    >
      <div className="h-0.5" style={{ backgroundColor: barColor }} />
      <div className="px-5 py-4">
        <p className="font-display text-3xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
        <p className="font-condensed font-semibold uppercase tracking-widest text-xs text-tertiary mt-1">
          {label}
        </p>
        {hint && (
          <p className="font-condensed text-[10px] uppercase tracking-widest text-tertiary opacity-70 mt-0.5">
            {hint}
          </p>
        )}
        {delta && (
          <span
            className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-xs font-condensed font-semibold ${deltaBadgeStyles[deltaType]}`}
          >
            {deltaIcons[deltaType]} {delta}
          </span>
        )}
      </div>
    </div>
  )
}
