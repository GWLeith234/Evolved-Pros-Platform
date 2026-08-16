'use client'

/**
 * Sprint 4C — Enhanced Scoreboard hero.
 * Motivational overview: streaks, daily pulse, goals pace, pillar map.
 * Uses design-system StatCard / ProgressBar / ProgressCircle / StreakBadge.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  StatCard,
  ProgressBar,
  ProgressCircle,
  Button,
} from '@evolved-pros/ui'
import { StreakBadge } from '@/components/ui/StreakBadge'
import { useToast } from '@/lib/toast'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { formatPct } from '@/lib/format'
import type { DailyPulseHabit, DailyPulseCommitment } from '@/components/home/DailyPulseCard'
import type { GoalForCard } from '@/components/home/GoalCard'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

export type PillarProgressRow = {
  number: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  slug: string
  pct: number
  completed: number
  total: number
  state: 'done' | 'active' | 'locked' | 'untouched'
}

export interface ScoreboardHeroProps {
  habits: DailyPulseHabit[]
  commitments: DailyPulseCommitment[]
  goals: GoalForCard[]
  pillars: PillarProgressRow[]
  courseHref: string
  courseLabel: string
  displayName?: string
  // Section visibility — all default true so /scoreboard renders the full hero
  // unchanged. Home passes subsets to place KPI/Pace and Pillar Overview into
  // its own below-the-fold order without duplicating the daily rings that its
  // above-the-fold accountability block already shows.
  showHeader?: boolean
  showKpi?: boolean
  showRings?: boolean
  showPace?: boolean
  showPillars?: boolean
}

function predictPace(goals: GoalForCard[]): string {
  if (!goals.length) {
    return 'Set a quarterly goal to unlock pace predictions.'
  }
  const avg = goals.reduce((s, g) => s + (g.progress_pct ?? 0), 0) / goals.length
  const delta = goals.reduce((s, g) => s + (g.weekly_delta ?? 0), 0) / goals.length
  if (avg >= 100) return 'Quarterly targets complete — time to raise the bar.'
  if (delta > 5) return `On fire: average +${Math.round(delta)} pts this week. Hold the cadence.`
  if (delta < -5) return `Pace dipped ${Math.round(Math.abs(delta))} pts this week. One focused block flips the trend.`
  if (avg >= 70) return 'Strong quarter. One clean week seals the finish.'
  if (avg >= 40) return 'Mid-pack. Stack three solid Daily Pulse days to accelerate.'
  return 'Early in the climb. Protect the daily chain — compounding starts now.'
}

export function ScoreboardHero({
  habits,
  commitments,
  goals,
  pillars,
  courseHref,
  courseLabel,
  displayName,
  showHeader = true,
  showKpi = true,
  showRings = true,
  showPace = true,
  showPillars = true,
}: ScoreboardHeroProps) {
  const { showToast } = useToast()
  const reduced = useReducedMotion()
  const celebrated = useRef(false)

  const habitsDone = habits.filter(h => h.completedToday).length
  const commitsDone = commitments.filter(c => c.is_completed).length
  const dailySlots = habits.length + commitments.length
  const dailyDone = habitsDone + commitsDone
  const dailyPct = dailySlots > 0 ? Math.round((dailyDone / dailySlots) * 100) : 0

  const bestStreak = useMemo(
    () => Math.max(0, ...habits.map(h => h.recentCount ?? 0), 0),
    [habits],
  )
  const activeStreakCount = habits.filter(h => (h.recentCount ?? 0) > 0).length

  const pillarsDone = pillars.filter(p => p.state === 'done').length
  const pillarsActive = pillars.filter(p => p.state === 'active').length
  const overallAcademy =
    pillars.length > 0
      ? Math.round(pillars.reduce((s, p) => s + p.pct, 0) / pillars.length)
      : 0

  const avgGoal =
    goals.length > 0
      ? Math.round(goals.reduce((s, g) => s + (g.progress_pct ?? 0), 0) / goals.length)
      : 0

  const insight = predictPace(goals)
  const firstName = displayName?.split(' ')[0]

  // One-shot welcome toast for strong streaks (not on every visit after dismiss key)
  useEffect(() => {
    if (celebrated.current) return
    // Only the header instance owns the streak-celebration toast, so rendering
    // KPI/Pillar slices elsewhere on a page can't double-fire it.
    if (!showHeader) return
    if (bestStreak < 7) return
    const key = `ep_scoreboard_streak_toast_${new Date().toISOString().slice(0, 10)}`
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      /* ignore */
    }
    celebrated.current = true
    showToast({
      title: 'Streak protected',
      message: `${bestStreak}-day discipline run. Keep the chain intact today.`,
      variant: 'success',
      duration: 4200,
    })
  }, [bestStreak, showToast, showHeader])

  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    if (reduced || dailyPct < 100) return
    setPulse(true)
    const t = window.setTimeout(() => setPulse(false), 1600)
    return () => window.clearTimeout(t)
  }, [dailyPct, reduced])

  return (
    <section
      className="scoreboard-hero"
      aria-label="Scoreboard overview"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Intro row */}
      {showHeader && (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-condensed), sans-serif',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--brand-gold, #C9A84C)',
            }}
          >
            {firstName ? `${firstName}'s` : 'Your'} operating system
          </p>
          <h2
            className="ep-fluid-title"
            style={{
              margin: '6px 0 0',
              fontFamily: 'var(--font-logo), sans-serif',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            Enhanced scoreboard
          </h2>
          <p
            style={{
              margin: '8px 0 0',
              fontFamily: 'Barlow, sans-serif',
              fontSize: 14,
              color: 'var(--text-secondary)',
              maxWidth: 480,
              lineHeight: 1.45,
            }}
          >
            Streaks, pillars, and quarterly pace — one surface to stay honest.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <StreakBadge days={bestStreak} bump={pulse} />
          <Button variant="primary" size="sm" href={courseHref}>
            {courseLabel.replace(/^Continue /, '')}
          </Button>
        </div>
      </div>
      )}

      {/* Metric strip */}
      {showKpi && (
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        style={{ width: '100%' }}
      >
        <StatCard
          value={dailySlots ? formatPct(dailyPct / 100) : '—'}
          label="Daily pulse"
          delta={
            dailySlots
              ? `${dailyDone}/${dailySlots} done`
              : 'Set habits'
          }
          deltaType={dailyPct >= 100 ? 'up' : dailyPct > 0 ? 'neutral' : 'neutral'}
          accent="teal"
        />
        <StatCard
          value={bestStreak > 0 ? `${bestStreak}D` : '0'}
          label="Best streak"
          delta={
            activeStreakCount > 0
              ? `${activeStreakCount} active`
              : 'Start today'
          }
          deltaType={bestStreak >= 7 ? 'up' : 'neutral'}
          accent="gold"
        />
        <StatCard
          value={goals.length ? formatPct(avgGoal / 100) : '—'}
          label="Goals avg"
          delta={goals.length ? `${goals.length} active` : 'Add a goal'}
          accent="violet"
        />
        <StatCard
          value={`${pillarsDone}/6`}
          label="Pillars done"
          delta={
            pillarsActive > 0
              ? `${pillarsActive} in progress`
              : overallAcademy > 0
                ? `${overallAcademy}% avg`
                : 'Open Academy'
          }
          accent="red"
          pillar={pillars.find(p => p.state === 'active')?.number}
        />
      </div>
      )}

      {/* Rings + insight + pillars */}
      {(showRings || showPace || showPillars) && (
      <div
        className={
          showRings && (showPace || showPillars)
            ? 'grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4'
            : 'flex flex-col gap-4'
        }
        style={{ alignItems: 'stretch' }}
      >
        {showRings && (
        <div
          className="ep-surface-card"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            padding: '20px 16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            minWidth: 0,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <ProgressCircle
              value={dailyPct}
              size="md"
              sublabel="Today"
              color={dailyPct >= 100 ? '#C9A84C' : undefined}
            />
            <p
              style={{
                margin: '8px 0 0',
                fontFamily: 'var(--font-condensed), sans-serif',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
              }}
            >
              Daily
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <ProgressCircle
              value={overallAcademy}
              size="md"
              sublabel="Academy"
              pillar={3}
            />
            <p
              style={{
                margin: '8px 0 0',
                fontFamily: 'var(--font-condensed), sans-serif',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
              }}
            >
              Architecture
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <ProgressCircle
              value={avgGoal}
              size="md"
              sublabel="Goals"
              pillar={5}
            />
            <p
              style={{
                margin: '8px 0 0',
                fontFamily: 'var(--font-condensed), sans-serif',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
              }}
            >
              Quarter
            </p>
          </div>
        </div>
        )}

        {(showPace || showPillars) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {/* Predictive insight */}
          {showPace && (
          <div
            className={`ep-surface-card${pulse ? ' scoreboard-hero--pulse' : ''}`}
            role="status"
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(10,191,163,0.08))',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid var(--brand-gold, #C9A84C)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-condensed), sans-serif',
                fontWeight: 800,
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--brand-gold, #C9A84C)',
              }}
            >
              Pace read
            </p>
            <p
              style={{
                margin: '6px 0 0',
                fontFamily: 'Barlow, sans-serif',
                fontSize: 14,
                lineHeight: 1.45,
                color: 'var(--text-primary)',
              }}
            >
              {insight}
            </p>
          </div>
          )}

          {/* Pillar overview */}
          {showPillars && (
          <div
            className="ep-surface-card"
            style={{
              padding: '14px 16px 16px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              flex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                }}
              >
                Pillar overview
              </p>
              <Link
                href="/academy"
                style={{
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--brand-teal, #0ABFA3)',
                  textDecoration: 'none',
                }}
              >
                Academy →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pillars.map(p => {
                const color = PILLAR_CONFIG[p.number]?.color
                return (
                  <Link
                    key={p.number}
                    href={`/academy/${p.slug}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <ProgressBar
                      label={`${p.number}. ${p.name}`}
                      value={p.pct}
                      pillar={p.number}
                      size="sm"
                      meta={
                        p.state === 'done'
                          ? '✓ Done'
                          : p.total
                            ? `${p.completed}/${p.total}`
                            : '—'
                      }
                      showPercent={p.state !== 'done'}
                      color={p.state === 'done' ? '#22c55e' : color}
                    />
                  </Link>
                )
              })}
            </div>
          </div>
          )}
        </div>
        )}
      </div>
      )}
    </section>
  )
}
