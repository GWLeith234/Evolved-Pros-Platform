'use client'

import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { getPillar } from '@/lib/pillars'

export type PillarStripState = 'earned' | 'in-progress' | 'locked'

export interface PillarStripItem {
  number: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  state: PillarStripState
  progressPct?: number
}

interface PillarJourneyStripProps {
  pillars: PillarStripItem[]
}

const RING_SIZE = 36

export function PillarJourneyStrip({ pillars }: PillarJourneyStripProps) {
  const earnedCount = pillars.filter(p => p.state === 'earned').length
  const inProgress  = pillars.find(p => p.state === 'in-progress')

  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
      {/* Inner card title is "Your roadmap" — NOT a second "The Path Forward".
          The section eyebrow above this band already says "The Path Forward"
          (A3.3: that heading must appear once in the band). */}
      <p
        className="font-condensed font-bold uppercase tracking-[0.18em] text-[12px] mb-3"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Your roadmap
      </p>

      <div className="flex items-center w-full">
        {pillars.map((p, i) => {
          const cfg = PILLAR_CONFIG[p.number]
          const name = getPillar(p.number)?.name ?? p.name
          const next = pillars[i + 1]
          // Connector: if either side is earned/in-progress, paint with a soft
          // colour gradient to suggest momentum; otherwise a flat grey line.
          const lineFrom = p.state === 'locked' ? 'rgba(255,255,255,0.18)' : cfg.color
          const lineTo   = next
            ? (next.state === 'locked' ? 'rgba(255,255,255,0.18)' : PILLAR_CONFIG[next.number].color)
            : 'rgba(255,255,255,0.18)'

          return (
            <div key={p.number} className="flex items-center" style={{ flex: i === pillars.length - 1 ? '0 0 auto' : '1 1 0' }}>
              <div
                className="rounded-full flex items-center justify-center font-display font-black text-[14px] shrink-0"
                style={{
                  width: RING_SIZE,
                  height: RING_SIZE,
                  background: p.state === 'earned'
                    ? cfg.color
                    : p.state === 'in-progress'
                      ? cfg.colorMuted
                      : 'transparent',
                  border: p.state === 'in-progress'
                    ? `2px solid ${cfg.color}`
                    : p.state === 'earned'
                      ? `2px solid ${cfg.color}`
                      : '2px solid rgba(255,255,255,0.18)',
                  color: p.state === 'earned' ? '#fff' : (p.state === 'in-progress' ? cfg.color : 'var(--text-tertiary)'),
                }}
                title={`${name} — ${p.state.replace('-', ' ')}`}
                aria-label={`Pillar ${p.number} ${name}: ${p.state.replace('-', ' ')}`}
              >
                {p.number}
              </div>
              {next && (
                <div
                  className="flex-1 mx-1"
                  style={{
                    height: 1,
                    minWidth: 16,
                    background: `linear-gradient(90deg, ${lineFrom}, ${lineTo})`,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-3 font-condensed text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
        {earnedCount} of 6 pillars earned
        {inProgress && (
          <>
            {' · '}
            <span style={{ color: PILLAR_CONFIG[inProgress.number].color, fontWeight: 700 }}>
              {getPillar(inProgress.number)?.name ?? inProgress.name}
            </span>
            {' in progress'}
          </>
        )}
      </p>
    </div>
  )
}
