import React from 'react'
import { getPillarColor } from '../tokens/index'

export interface ProgressBarProps {
  /** Completion percentage, 0–100. */
  value: number
  /** Optional label shown above the track. */
  label?: string
  /** Optional right-aligned meta text (e.g. "3 of 8 · 40%"). */
  meta?: string
  /** Pillar number/key — drives the fill color when `color` isn't given. */
  pillar?: number | string | null
  /** Explicit fill color; overrides the pillar color. */
  color?: string
  /** Explicit track (unfilled) color. */
  trackColor?: string
  /** Show the percentage on the right of the header row. */
  showPercent?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function ProgressBar({
  value,
  label,
  meta,
  pillar,
  color,
  trackColor,
  showPercent = false,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  const fill = color ?? getPillarColor(pillar ?? null)
  const height = size === 'sm' ? 6 : 10
  const rightText = meta ?? (showPercent ? `${pct}%` : undefined)

  return (
    <div className={className}>
      {(label || rightText) && (
        <div className="flex items-center justify-between mb-1.5 gap-3">
          {label && (
            <span className="font-condensed font-semibold text-[13px] truncate" style={{ color: 'var(--text-primary)' }}>
              {label}
            </span>
          )}
          {rightText && (
            <span className="font-condensed text-[11px] flex-shrink-0 ml-auto" style={{ color: 'var(--text-tertiary)' }}>
              {rightText}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          height,
          borderRadius: 9999,
          backgroundColor: trackColor ?? 'var(--bg-elevated, rgba(255,255,255,0.08))',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: fill,
            borderRadius: 9999,
            transition: 'width 300ms ease',
          }}
        />
      </div>
    </div>
  )
}
