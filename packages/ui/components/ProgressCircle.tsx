import React from 'react'
import { getPillarColor } from '../tokens/index'

export interface ProgressCircleProps {
  /** Completion percentage, 0–100. */
  value: number
  size?: 'sm' | 'md' | 'lg'
  /** Small caption under the percentage (e.g. "Today"). */
  sublabel?: string
  /** Explicit ring color; overrides the pillar color. */
  color?: string
  /** Pillar number/key — drives the ring color when `color` isn't given. */
  pillar?: number | string | null
  className?: string
}

const DIMENSIONS: Record<NonNullable<ProgressCircleProps['size']>, number> = {
  sm: 64,
  md: 96,
  lg: 128,
}

export function ProgressCircle({
  value,
  size = 'md',
  sublabel,
  color,
  pillar,
  className = '',
}: ProgressCircleProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  const dim = DIMENSIONS[size]
  const stroke = size === 'sm' ? 6 : 8
  const radius = (dim - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct / 100)
  const ring = color ?? getPillarColor(pillar ?? null)

  return (
    <div className={className} style={{ position: 'relative', width: dim, height: dim }}>
      <svg width={dim} height={dim} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-elevated, rgba(255,255,255,0.10))"
          strokeWidth={stroke}
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 400ms ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          className="font-display font-black"
          style={{ color: 'var(--text-primary)', fontSize: size === 'sm' ? 14 : 18, lineHeight: 1 }}
        >
          {pct}%
        </span>
        {sublabel && (
          <span
            className="font-condensed uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)', fontSize: 9, marginTop: 2 }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}
