'use client'

import { useEffect, useState } from 'react'

interface ScorePoint { date: string; pct: number }

interface CompoundHeroProps {
  completedCount: number
  totalCount: number
  currentStreak?: number
}

/** Build a smooth SVG path through pct values. W×H of the viewBox is 200×40. */
function buildSparkPath(points: ScorePoint[], w = 200, h = 40): string {
  if (points.length < 2) return ''

  const xs = points.map((_, i) => (i / (points.length - 1)) * w)
  const ys = points.map(p => h - (p.pct / 100) * h * 0.85 - h * 0.075)

  // Smooth cubic bezier path
  let d = `M ${xs[0]},${ys[0]}`
  for (let i = 1; i < xs.length; i++) {
    const cpx = (xs[i - 1] + xs[i]) / 2
    d += ` C ${cpx},${ys[i - 1]} ${cpx},${ys[i]} ${xs[i]},${ys[i]}`
  }
  return d
}

function buildAreaPath(points: ScorePoint[], w = 200, h = 40): string {
  const line = buildSparkPath(points, w, h)
  if (!line) return ''
  return `${line} L ${w},${h} L 0,${h} Z`
}

export function CompoundHero({ completedCount, totalCount, currentStreak }: CompoundHeroProps) {
  const [sparkData, setSparkData] = useState<ScorePoint[]>([])

  useEffect(() => {
    fetch('/api/habits/lifetime')
      .then(r => r.ok ? r.json() : null)
      .then((d: { scores?: ScorePoint[] } | null) => {
        if (d?.scores) setSparkData(d.scores.slice(-14)) // last 14 days
      })
      .catch(() => {/* non-critical */})
  }, [])

  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const sparkLine = buildSparkPath(sparkData)
  const sparkArea = buildAreaPath(sparkData)

  return (
    <div
      className="rounded-lg px-6 py-7 flex flex-col items-center text-center"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid rgba(201,168,76,0.2)',
      }}
    >
      <p
        className="font-condensed font-bold uppercase tracking-[0.22em] mb-2"
        style={{ fontSize: '10px', color: 'rgba(201,168,76,0.6)' }}
      >
        Today&apos;s Compound Score
      </p>

      <p
        className="font-condensed font-bold leading-none"
        style={{ fontSize: '72px', color: '#C9A84C' }}
      >
        {pct}
        <span style={{ fontSize: '32px', marginLeft: '4px', color: 'rgba(201,168,76,0.7)' }}>%</span>
      </p>

      <p
        className="font-body mt-2"
        style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}
      >
        {completedCount} of {totalCount} habits complete
        {(currentStreak ?? 0) > 0 && (
          <span style={{ color: '#0ABFA3', marginLeft: '8px' }}>
            🔥 {currentStreak}d streak
          </span>
        )}
      </p>

      {/* Progress bar */}
      <div
        className="w-full max-w-xs mt-4 rounded-full overflow-hidden"
        style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: '#C9A84C' }}
        />
      </div>

      {/* Sparkline — only renders if we have data */}
      {sparkData.length >= 2 && (
        <div className="w-full max-w-xs mt-5">
          <p
            className="font-condensed uppercase tracking-[0.14em] mb-1.5 text-left"
            style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)' }}
          >
            14-day curve
          </p>
          <svg
            viewBox="0 0 200 40"
            className="w-full"
            style={{ height: '40px', overflow: 'visible' }}
            aria-hidden="true"
          >
            {/* Area fill */}
            <path
              d={sparkArea}
              fill="url(#sparkGrad)"
              opacity={0.35}
            />
            {/* Line */}
            <path
              d={sparkLine}
              fill="none"
              stroke="#C9A84C"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Gradient def */}
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#C9A84C" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#C9A84C" stopOpacity="0"   />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </div>
  )
}
