'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { formatPct, formatCount, formatTrend, formatDate } from '@/lib/format'
import type { GoalForCard } from './GoalCard'
import type { DailyPulseHabit, DailyPulseCommitment } from './DailyPulseCard'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const GOLD = '#C9A84C'
const TEAL = '#0ABFA3'
const RED = '#C9302A'
const DIM = 'var(--text-tertiary)'

export interface AccountabilityHubProps {
  habits?: DailyPulseHabit[]
  commitments?: DailyPulseCommitment[]
  goals?: GoalForCard[]
  /** Continue / start course deep link */
  courseHref: string
  courseLabel: string
  /** compact = home strip; full = legacy scoreboard layout */
  variant?: 'compact' | 'full'
  weekLabel?: string
  /** Render the inline "This week · Commits" list. Default true; Home passes
   *  false so the standalone CommitmentTracker is the single source of truth. */
  showCommitmentsList?: boolean
  /** Render the inline "The long game · Goals" list. Default true; Home passes
   *  false so the standalone GoalCard grid is the single source of truth. */
  showGoalsList?: boolean
}

function clampPct(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)))
}

/** Animated SVG progress ring — draws in on mount (respects reduced motion). */
function ProgressRing({
  pct,
  size = 88,
  stroke = 7,
  color,
  label,
  sublabel,
  delayMs = 0,
}: {
  pct: number
  size?: number
  stroke?: number
  color: string
  label: string
  sublabel?: string
  delayMs?: number
}) {
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (reduced) {
      setMounted(true)
      return
    }
    const t = window.setTimeout(() => setMounted(true), delayMs)
    return () => window.clearTimeout(t)
  }, [reduced, delayMs])

  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const target = clampPct(pct)
  const offset = mounted ? c * (1 - target / 100) : c

  return (
    <div
      className="hub-ring"
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={stroke}
        />
        <circle
          suppressHydrationWarning
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="hub-ring-arc"
          style={{
            transition: reduced
              ? 'none'
              : 'stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1), stroke 0.25s ease',
          }}
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
          lineHeight: 1,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-logo), sans-serif',
            fontSize: size >= 96 ? 28 : 22,
            letterSpacing: '0.02em',
            color: 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatPct(target / 100)}
        </span>
        {sublabel && (
          <span
            style={{
              marginTop: 2,
              fontFamily: 'var(--font-condensed), sans-serif',
              fontWeight: 700,
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color,
            }}
          >
            {sublabel}
          </span>
        )}
      </div>
      <span className="sr-only">{label}: {target} percent</span>
    </div>
  )
}

/** Horizontal bar that fills on mount. */
function ProgressBar({
  pct,
  color,
  height = 6,
  delayMs = 0,
}: {
  pct: number
  color: string
  height?: number
  delayMs?: number
}) {
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (reduced) {
      setMounted(true)
      return
    }
    const t = window.setTimeout(() => setMounted(true), delayMs)
    return () => window.clearTimeout(t)
  }, [reduced, delayMs])

  const w = clampPct(pct)
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 999,
        background: 'var(--bg-elevated)',
        overflow: 'hidden',
      }}
    >
      <div
        className="hub-bar-fill"
        style={{
          height: '100%',
          width: mounted ? `${w}%` : '0%',
          background: color,
          borderRadius: 999,
          transition: reduced
            ? 'none'
            : 'width 0.85s cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: w > 0 ? `0 0 12px ${color}55` : undefined,
        }}
      />
    </div>
  )
}

function Checkbox({ checked, color }: { checked: boolean; color: string }) {
  return (
    <span
      aria-hidden
      style={{
        flexShrink: 0,
        width: 18,
        height: 18,
        background: checked ? color : 'transparent',
        border: `2px solid ${checked ? color : 'var(--text-tertiary)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
          <path
            d="M2 5.5L4.5 8L9 3"
            stroke="#0A0F18"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}

export function AccountabilityHub({
  habits: initialHabits = [],
  commitments: initialCommits = [],
  goals: initialGoals = [],
  courseHref,
  courseLabel,
  variant = 'compact',
  showCommitmentsList = true,
  showGoalsList = true,
  weekLabel,
}: AccountabilityHubProps) {
  const safeHabits = Array.isArray(initialHabits) ? initialHabits : []
  const safeCommits = Array.isArray(initialCommits) ? initialCommits : []
  const safeGoals = Array.isArray(initialGoals) ? initialGoals : []

  const [habits, setHabits] = useState(safeHabits)
  const [commits, setCommits] = useState(safeCommits)
  const [goals, setGoals] = useState(safeGoals)
  const [pendingHabit, setPendingHabit] = useState<string | null>(null)
  const [pendingCommit, setPendingCommit] = useState<string | null>(null)
  const [loggingGoalId, setLoggingGoalId] = useState<string | null>(null)
  const [draftPct, setDraftPct] = useState<Record<string, number>>({})
  const [savingGoal, setSavingGoal] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const habitsDone = habits.filter(h => h.completedToday).length
  const commitsDone = commits.filter(c => c.is_completed).length
  // Daily score: weight habits + commits equally when both exist
  const dailySlots = (habits.length || 0) + (commits.length || 0)
  const dailyDone = habitsDone + commitsDone
  const dailyPct = dailySlots > 0 ? Math.round((dailyDone / dailySlots) * 100) : 0

  const avgGoalPct = useMemo(() => {
    if (!goals.length) return 0
    const sum = goals.reduce((acc, g) => acc + (g.progress_pct ?? 0), 0)
    return Math.round(sum / goals.length)
  }, [goals])

  const weekDelta = useMemo(() => {
    if (!goals.length) return 0
    const sum = goals.reduce((acc, g) => acc + (g.weekly_delta ?? 0), 0)
    return Math.round(sum / goals.length)
  }, [goals])

  const ringColor = dailyPct >= 100 ? GOLD : dailyPct > 0 ? TEAL : DIM
  const weekColor = avgGoalPct >= 70 ? GOLD : avgGoalPct > 0 ? TEAL : DIM
  const isFull = variant === 'full'

  async function toggleHabit(h: DailyPulseHabit) {
    if (pendingHabit === h.id) return
    setPendingHabit(h.id)
    const previous = habits
    const next = !h.completedToday
    setHabits(
      previous.map(x =>
        x.id === h.id
          ? {
              ...x,
              completedToday: next,
              recentCount: Math.max(0, x.recentCount + (next ? 1 : -1)),
            }
          : x,
      ),
    )
    try {
      const res = await fetch('/api/member/habits/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_id: h.id,
          date: new Date().toISOString().split('T')[0],
        }),
      })
      if (!res.ok) setHabits(previous)
      else if (next) pulseFlash('Habit logged')
    } catch {
      setHabits(previous)
    } finally {
      setPendingHabit(null)
    }
  }

  async function toggleCommit(c: DailyPulseCommitment) {
    if (pendingCommit === c.id) return
    setPendingCommit(c.id)
    const previous = commits
    const next = !c.is_completed
    setCommits(previous.map(x => (x.id === c.id ? { ...x, is_completed: next } : x)))
    try {
      const res = await fetch(`/api/commitments/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: next }),
      })
      if (!res.ok) setCommits(previous)
      else if (next) pulseFlash('Commitment checked')
    } catch {
      setCommits(previous)
    } finally {
      setPendingCommit(null)
    }
  }

  function openLogProgress(goal: GoalForCard) {
    setLoggingGoalId(goal.id)
    setDraftPct(prev => ({ ...prev, [goal.id]: goal.progress_pct ?? 0 }))
  }

  async function saveGoalProgress(goalId: string) {
    if (savingGoal) return
    const pct = draftPct[goalId]
    if (pct == null || !Number.isFinite(pct)) return
    setSavingGoal(goalId)
    const previous = goals
    setGoals(previous.map(g => (g.id === goalId ? { ...g, progress_pct: clampPct(pct) } : g)))
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress_pct: clampPct(pct) }),
      })
      if (!res.ok) {
        setGoals(previous)
      } else {
        const json = (await res.json()) as { goal?: GoalForCard }
        if (json.goal) {
          setGoals(prev =>
            prev.map(g =>
              g.id === goalId
                ? {
                    ...g,
                    progress_pct: json.goal!.progress_pct,
                    weekly_delta: json.goal!.weekly_delta,
                  }
                : g,
            ),
          )
        }
        setLoggingGoalId(null)
        pulseFlash('Progress saved')
      }
    } catch {
      setGoals(previous)
    } finally {
      setSavingGoal(null)
    }
  }

  function pulseFlash(msg: string) {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 1800)
  }

  const habitSlice = isFull ? habits : habits.slice(0, 3)
  const commitSlice = isFull ? commits : commits.slice(0, 2)
  const goalSlice = isFull ? goals : goals.slice(0, 3)

  return (
    <section
      id="accountability-hub"
      aria-label="Accountability Hub"
      className="hub-root"
      style={{
        width: '100%',
        maxWidth: 1440,
        margin: '0 auto',
        position: 'relative',
      }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderTop: `3px solid ${GOLD}`,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            padding: isFull ? '20px 24px 12px' : '16px 18px 10px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-condensed), sans-serif',
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: GOLD,
              }}
            >
              Accountability Hub
            </p>
            <h2
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-logo), sans-serif',
                fontSize: isFull ? 34 : 26,
                letterSpacing: '0.04em',
                lineHeight: 1,
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
              }}
            >
              {isFull ? 'Daily scoreboard' : 'Own the day'}
            </h2>
            {weekLabel && (
              <p
                style={{
                  margin: '6px 0 0',
                  fontFamily: 'var(--font-body), sans-serif',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                }}
              >
                Week of {weekLabel}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {flash && (
              <span
                className="hub-flash"
                style={{
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: TEAL,
                  padding: '4px 10px',
                  background: 'rgba(10,191,163,0.12)',
                  border: '1px solid rgba(10,191,163,0.28)',
                }}
              >
                {flash}
              </span>
            )}
            {!isFull && (
              <Link
                href="/home"
                style={{
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: GOLD,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Open hub →
              </Link>
            )}
          </div>
        </div>

        {/* Rings + stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isFull
              ? 'auto auto 1fr'
              : 'auto auto 1fr',
            gap: isFull ? 28 : 18,
            alignItems: 'center',
            padding: isFull ? '22px 24px' : '16px 18px',
            borderBottom: '1px solid var(--border-color)',
          }}
          className="hub-overview-grid"
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <ProgressRing
              pct={dailyPct}
              size={isFull ? 108 : 88}
              color={ringColor}
              label="Today"
              sublabel="Today"
              delayMs={40}
            />
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-condensed), sans-serif',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
                textAlign: 'center',
              }}
            >
              {formatCount(dailyDone, dailySlots || 1, 'done')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <ProgressRing
              pct={avgGoalPct}
              size={isFull ? 108 : 88}
              color={weekColor}
              label="Goals"
              sublabel="Goals"
              delayMs={160}
            />
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-condensed), sans-serif',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: weekDelta < 0 ? '#ef0e30' : 'var(--text-tertiary)',
                textAlign: 'center',
              }}
            >
              {goals.length ? formatTrend(weekDelta / 100) : 'No goals'} week
            </p>
          </div>

          {/* Stat chips */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 10,
              minWidth: 0,
            }}
          >
            <StatChip
              label="Habits"
              value={`${habitsDone}/${habits.length || 0}`}
              accent={GOLD}
              hint={habits.length ? 'today' : 'set up habits'}
            />
            <StatChip
              label="Commits"
              value={`${commitsDone}/${commits.length || 0}`}
              accent={TEAL}
              hint="this week"
            />
            {/* SPRINT M.1: the Goals % chip duplicated the Goals ring above (same
                56% avg, two treatments back-to-back). The ring is the single Goals
                treatment in the hub; the chips now show only the daily-actionable
                metrics (habits + commits). */}
          </div>
        </div>

        {/* Quick actions — the daily habit driver CTAs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            padding: isFull ? '14px 24px' : '12px 18px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-elevated)',
          }}
        >
          <QuickAction
            href="#hub-habits"
            label={habitsDone < habits.length ? 'Log progress' : 'Review habits'}
            accent={GOLD}
            primary
            onClick={() => {
              document.getElementById('hub-habits')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }}
          />
          <QuickAction
            href={courseHref}
            label={courseLabel}
            accent={RED}
          />
          {goals[0] && (
            <button
              type="button"
              onClick={() => openLogProgress(goals[0])}
              style={quickBtnStyle(TEAL, false)}
            >
              Update goal
            </button>
          )}
        </div>

        {/* Body: habits + commits + goals */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isFull ? '1fr 1fr' : '1fr',
            gap: 0,
          }}
          className="hub-body-grid"
        >
          {/* Left: daily practice */}
          <div
            id="hub-habits"
            style={{
              padding: isFull ? '18px 24px 22px' : '14px 18px 18px',
              borderRight: isFull ? '1px solid var(--border-color)' : undefined,
            }}
          >
            <SectionLabel>Today · Habits</SectionLabel>
            {habitSlice.length === 0 ? (
              <EmptyHint>
                No habits yet.{' '}
                <Link href="/academy/accountability" style={{ color: TEAL }}>
                  Build your stack →
                </Link>
              </EmptyHint>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {habitSlice.map(h => (
                  <li
                    key={h.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 0',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleHabit(h)}
                      disabled={pendingHabit === h.id}
                      aria-label={
                        h.completedToday
                          ? `Mark ${h.name} incomplete`
                          : `Mark ${h.name} complete`
                      }
                      className="ep-pressable"
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 10,
                        margin: -10,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 44,
                        minHeight: 44,
                      }}
                    >
                      <Checkbox checked={h.completedToday} color={GOLD} />
                    </button>
                    <span
                      style={{
                        flex: 1,
                        fontFamily: 'var(--font-body), sans-serif',
                        fontSize: 13,
                        color: h.completedToday
                          ? 'var(--text-tertiary)'
                          : 'var(--text-primary)',
                        textDecoration: h.completedToday ? 'line-through' : 'none',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h.name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-condensed), sans-serif',
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        color: h.recentCount > 0 ? GOLD : 'var(--text-tertiary)',
                        background:
                          h.recentCount > 0
                            ? 'rgba(201,168,76,0.14)'
                            : 'var(--bg-elevated)',
                        padding: '2px 7px',
                      }}
                    >
                      {h.recentCount}D
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {showCommitmentsList && (
            <div style={{ marginTop: 16 }}>
              <SectionLabel>This week · Commits</SectionLabel>
              {commitSlice.length === 0 ? (
                <EmptyHint>
                  No commitments this week.{' '}
                  <Link href="/academy/accountability" style={{ color: TEAL }}>
                    Set them →
                  </Link>
                </EmptyHint>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {commitSlice.map(c => (
                    <li
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 0',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleCommit(c)}
                        disabled={pendingCommit === c.id}
                        aria-label={
                          c.is_completed
                            ? `Mark ${c.commitment} incomplete`
                            : `Mark ${c.commitment} complete`
                        }
                        className="ep-pressable"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 10,
                          margin: -10,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 44,
                          minHeight: 44,
                        }}
                      >
                        <Checkbox checked={c.is_completed} color={TEAL} />
                      </button>
                      <span
                        style={{
                          flex: 1,
                          fontFamily: 'var(--font-body), sans-serif',
                          fontSize: 13,
                          color: c.is_completed
                            ? 'var(--text-tertiary)'
                            : 'var(--text-primary)',
                          textDecoration: c.is_completed ? 'line-through' : 'none',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.commitment}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            )}
          </div>

          {/* Right / below: goals */}
          {showGoalsList && (
          <div
            id="hub-goals"
            style={{
              padding: isFull ? '18px 24px 22px' : '4px 18px 18px',
              borderTop: isFull ? undefined : '1px solid var(--border-color)',
            }}
          >
            <SectionLabel>The long game · Goals</SectionLabel>
            {goalSlice.length === 0 ? (
              <EmptyHint>
                No active quarterly goals yet. Progress compounds when you name the target.
              </EmptyHint>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {goalSlice.map((g, i) => (
                  <li
                    key={g.id}
                    style={{
                      padding: '12px 12px 10px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `3px solid ${GOLD}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-body), sans-serif',
                          fontWeight: 600,
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          lineHeight: 1.3,
                        }}
                      >
                        {g.title}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-condensed), sans-serif',
                          fontWeight: 700,
                          fontSize: 11,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: GOLD,
                          flexShrink: 0,
                        }}
                      >
                        {formatDate(g.period, 'deadline')}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-logo), sans-serif',
                          fontSize: 22,
                          letterSpacing: '0.02em',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {formatPct((g.progress_pct ?? 0) / 100)}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-condensed), sans-serif',
                          fontWeight: 700,
                          fontSize: 12,
                          color:
                            (g.weekly_delta ?? 0) < 0 ? '#ef0e30' : TEAL,
                        }}
                      >
                        {formatTrend((g.weekly_delta ?? 0) / 100)}
                      </span>
                    </div>
                    <ProgressBar
                      pct={g.progress_pct ?? 0}
                      color={GOLD}
                      delayMs={80 + i * 80}
                    />

                    {loggingGoalId === g.id ? (
                      <div
                        style={{
                          marginTop: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={draftPct[g.id] ?? g.progress_pct ?? 0}
                          onChange={e =>
                            setDraftPct(prev => ({
                              ...prev,
                              [g.id]: Number(e.target.value),
                            }))
                          }
                          aria-label={`Progress for ${g.title}`}
                          style={{ flex: 1, minWidth: 120, accentColor: GOLD }}
                        />
                        <span
                          style={{
                            fontFamily: 'var(--font-logo), sans-serif',
                            fontSize: 18,
                            width: 44,
                            textAlign: 'right',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {clampPct(draftPct[g.id] ?? 0)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => saveGoalProgress(g.id)}
                          disabled={savingGoal === g.id}
                          style={quickBtnStyle(GOLD, true)}
                        >
                          {savingGoal === g.id ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoggingGoalId(null)}
                          style={quickBtnStyle(DIM, false)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openLogProgress(g)}
                        style={{
                          marginTop: 10,
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-condensed), sans-serif',
                          fontWeight: 800,
                          fontSize: 11,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: TEAL,
                        }}
                      >
                        Log progress →
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          )}
        </div>
      </div>

    </section>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 8px',
        fontFamily: 'var(--font-condensed), sans-serif',
        fontWeight: 800,
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--text-tertiary)',
      }}
    >
      {children}
    </p>
  )
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        fontFamily: 'var(--font-body), sans-serif',
        fontSize: 13,
        color: 'var(--text-tertiary)',
        lineHeight: 1.45,
      }}
    >
      {children}
    </p>
  )
}

function StatChip({
  label,
  value,
  accent,
  hint,
}: {
  label: string
  value: string
  accent: string
  hint: string
}) {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${accent}`,
        minWidth: 0,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-condensed), sans-serif',
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: accent,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: '4px 0 0',
          fontFamily: 'var(--font-logo), sans-serif',
          fontSize: 24,
          letterSpacing: '0.02em',
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          margin: '4px 0 0',
          fontFamily: 'var(--font-body), sans-serif',
          fontSize: 11,
          color: 'var(--text-tertiary)',
        }}
      >
        {hint}
      </p>
    </div>
  )
}

function quickBtnStyle(accent: string, primary: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    fontFamily: 'var(--font-condensed), sans-serif',
    fontWeight: 800,
    fontSize: 11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    cursor: 'pointer',
    border: primary ? `1px solid ${accent}` : '1px solid var(--border-color)',
    background: primary ? accent : 'transparent',
    color: primary ? '#0A0F18' : accent === DIM ? 'var(--text-secondary)' : accent,
    transition: 'transform 140ms ease, border-color 140ms ease',
  }
}

function QuickAction({
  href,
  label,
  accent,
  primary,
  onClick,
}: {
  href: string
  label: string
  accent: string
  primary?: boolean
  onClick?: () => void
}) {
  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={quickBtnStyle(accent, !!primary)}>
        {label}
      </button>
    )
  }
  return (
    <Link href={href} style={quickBtnStyle(accent, !!primary)}>
      {label}
    </Link>
  )
}
