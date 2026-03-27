import React from 'react'

type DeltaType = 'up' | 'neutral'
type Accent = 'red' | 'teal' | 'navy' | 'gold'

interface StatCardProps {
  value: string | number
  label: string
  delta?: string
  deltaType?: DeltaType
  accent?: Accent
  className?: string
}

const accentColors: Record<Accent, string> = {
  red:   '#ef0e30',
  teal:  '#68a2b9',
  navy:  '#1b3c5a',
  gold:  '#c9a84c',
}

const deltaBadgeStyles: Record<DeltaType, string> = {
  up:      'bg-emerald-50 text-emerald-700',
  neutral: 'bg-[rgba(27,60,90,0.06)] text-[#7a8a96]',
}

const deltaIcons: Record<DeltaType, string> = {
  up:      '↑',
  neutral: '',
}

export function StatCard({
  value,
  label,
  delta,
  deltaType = 'neutral',
  accent = 'teal',
  className = '',
}: StatCardProps) {
  return (
    <div className={`bg-white border border-[rgba(27,60,90,0.12)] rounded-lg overflow-hidden ${className}`}>
      <div className="h-0.5" style={{ backgroundColor: accentColors[accent] }} />
      <div className="px-5 py-4">
        <p className="font-display text-3xl font-black text-[#1b3c5a] leading-none">
          {value}
        </p>
        <p className="font-condensed font-semibold uppercase tracking-widest text-xs text-[#7a8a96] mt-1">
          {label}
        </p>
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
