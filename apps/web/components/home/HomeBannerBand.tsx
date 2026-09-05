import Link from 'next/link'
import { ProgressBar } from '@evolved-pros/ui'
import { formatPct } from '@/lib/format'
import { StreakBadge } from '@/components/ui/StreakBadge'
import {
  HOME_PILLAR_CHIPS,
  formatLagDelta,
  formatQuarterChip,
  type HomePillarState,
  winChipLabel,
} from '@/lib/home/bands'
import type { GoalForCard } from './GoalCard'

export interface HomeBannerPillar {
  number: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  state: HomePillarState
  progressPct?: number
}

export interface HomeWinChip {
  id: string
  label: string
  href?: string
}

interface HomeBannerBandProps {
  wig: GoalForCard | null
  pillars: HomeBannerPillar[]
  streakDays: number
  checkedInToday: boolean
  wins: HomeWinChip[]
}

export function HomeBannerBand({
  wig,
  pillars,
  streakDays,
  checkedInToday,
  wins,
}: HomeBannerBandProps) {
  const periodChip = wig ? formatQuarterChip(wig.period) : null
  const delta = wig ? formatLagDelta(wig.weekly_delta) : null
  const progress = wig ? Math.max(0, Math.min(100, Math.round(wig.progress_pct))) : 0

  return (
    <section
      aria-label="Quarterly WIG"
      className="ep-surface-card overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div
        className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(220px,0.9fr)] lg:items-start"
        style={{ padding: 'var(--space-card-lg, 24px)' }}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-condensed text-ep-label font-bold uppercase tracking-[0.18em] text-tertiary m-0">
              Quarterly WIG
            </p>
            {periodChip && (
              <span
                className="font-condensed text-ep-label font-bold uppercase tracking-[0.12em] px-2 py-0.5"
                style={{
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {periodChip}
              </span>
            )}
          </div>

          {wig ? (
            <>
              <h2 className="font-bebas text-[28px] sm:text-[34px] leading-none tracking-[0.02em] text-primary mt-3 mb-0">
                {wig.title}
              </h2>
              <div className="flex flex-wrap items-baseline gap-3 mt-4">
                <span className="font-bebas text-[40px] leading-none tracking-[0.02em] text-primary">
                  {formatPct(progress / 100)}
                </span>
                {delta && (
                  <span
                    className="font-condensed text-[13px] font-bold uppercase tracking-[0.08em]"
                    style={{
                      color:
                        delta.direction === 'up'
                          ? 'var(--success-green)'
                          : delta.direction === 'down'
                            ? 'var(--red)'
                            : 'var(--text-tertiary)',
                    }}
                  >
                    {delta.direction === 'up' ? '↑ ' : delta.direction === 'down' ? '↓ ' : ''}
                    {delta.text}
                  </span>
                )}
              </div>
              <div className="mt-3 max-w-md">
                <ProgressBar
                  value={progress}
                  color="var(--teal)"
                  size="sm"
                  showPercent={false}
                />
              </div>
              <p className="font-condensed text-ep-label font-bold uppercase tracking-[0.18em] text-tertiary mt-3 mb-0">
                Lag measure
              </p>
            </>
          ) : (
            <div className="mt-3">
              <h2 className="font-bebas text-[28px] leading-none tracking-[0.02em] text-primary mt-0 mb-2">
                Name this quarter&apos;s WIG
              </h2>
              <p className="font-body text-ep-body-sm text-secondary m-0">
                Set the lag you will move. Leading measures live in the band below.
              </p>
              <Link
                href="/leaderboard"
                className="inline-flex mt-4 font-condensed text-[12px] font-bold uppercase tracking-[0.14em] no-underline"
                style={{ color: 'var(--teal)' }}
              >
                Open scoreboard
              </Link>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="font-condensed text-ep-label font-bold uppercase tracking-[0.18em] text-tertiary m-0 mb-3">
            Academy pillars
          </p>
          <ul className="flex flex-wrap gap-2 m-0 p-0 list-none">
            {HOME_PILLAR_CHIPS.map(chip => {
              const src = pillars.find(p => p.number === chip.n)
              const state = src?.state ?? 'locked'
              return (
                <li key={chip.n}>
                  <span
                    className="inline-flex items-center gap-1.5 font-condensed text-[11px] font-bold uppercase tracking-[0.08em] px-2.5 py-1"
                    style={{
                      color:
                        state === 'locked' ? 'var(--text-tertiary)' : 'var(--text-primary)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                    }}
                    title={chip.name}
                  >
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                      style={{
                        background:
                          state === 'locked'
                            ? 'var(--text-tertiary)'
                            : `var(--pillar-${chip.n})`,
                      }}
                    />
                    {chip.chip}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-4 min-w-0">
          <div
            className="flex items-start gap-3"
            style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
            }}
          >
            <span aria-hidden className="text-lg leading-none">
              🔥
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-condensed text-[15px] font-bold text-primary m-0">
                  {streakDays > 0 ? `${streakDays}-day streak` : 'No streak yet'}
                </p>
                <StreakBadge days={streakDays} />
              </div>
              <p className="font-body text-ep-body-sm text-secondary m-0 mt-1">
                {checkedInToday ? 'Checked in today' : 'Check a leading measure to protect it'}
              </p>
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span aria-hidden className="text-lg leading-none">
                🏆
              </span>
              <p className="font-condensed text-[15px] font-bold text-primary m-0">
                {wins.length === 1 ? '1 win this week' : `${wins.length} wins this week`}
              </p>
            </div>
            {wins.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5 m-0 p-0 list-none">
                {wins.slice(0, 3).map(win => (
                  <li key={win.id}>
                    {win.href ? (
                      <Link
                        href={win.href}
                        className="inline-block font-condensed text-[11px] font-semibold no-underline px-2 py-0.5"
                        style={{
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {winChipLabel(win.label)}
                      </Link>
                    ) : (
                      <span
                        className="inline-block font-condensed text-[11px] font-semibold px-2 py-0.5"
                        style={{
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {winChipLabel(win.label)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-body text-ep-body-sm text-tertiary m-0">
                Log a win in Community when you close one.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
