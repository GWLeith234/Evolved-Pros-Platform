'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPct, formatCount } from '@/lib/format'

const GOLD = '#C9A84C'
const TEAL = '#0ABFA3'
const DIM  = 'rgba(255,255,255,0.18)'

export interface DailyPulseHabit {
  id: string
  name: string
  pillar: string | null
  completedToday: boolean
  recentCount: number
}

export interface DailyPulseCommitment {
  id: string
  commitment: string
  is_completed: boolean
}

interface Props {
  habits?: DailyPulseHabit[]
  commitments?: DailyPulseCommitment[]
}

const HABITS_TOTAL  = 3
const COMMITS_TOTAL = 2

export function DailyPulseCard({ habits: initialHabits = [], commitments: initialCommits = [] }: Props) {
  // Defensive: an undefined fetch result on the page side used to bubble
  // up here as `habits.filter is not a function`, which the React
  // Suspense/error boundary swallowed silently (#422) — the entire card
  // disappeared from the 4-up grid. Defaulting to [] at the prop level
  // keeps the empty-state UI in place even if the upstream fetcher
  // returns undefined.
  const safeInitialHabits = Array.isArray(initialHabits) ? initialHabits : []
  const safeInitialCommits = Array.isArray(initialCommits) ? initialCommits : []
  const [habits, setHabits] = useState(safeInitialHabits)
  const [commits, setCommits] = useState(safeInitialCommits)
  const [pendingHabit, setPendingHabit] = useState<string | null>(null)
  const [pendingCommit, setPendingCommit] = useState<string | null>(null)

  const habitsDone  = habits.filter(h => h.completedToday).length
  const commitsDone = commits.filter(c => c.is_completed).length
  const totalSlots  = HABITS_TOTAL + COMMITS_TOTAL
  const totalDone   = habitsDone + commitsDone
  const pct         = totalSlots ? Math.round((totalDone / totalSlots) * 100) : 0

  const ringColor = pct >= 100 ? GOLD : pct > 0 ? TEAL : DIM

  // SVG ring math (r=46, viewbox=120)
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(100, Math.max(0, pct)) / 100)

  async function toggleHabit(h: DailyPulseHabit) {
    if (pendingHabit === h.id) return
    setPendingHabit(h.id)
    const previous = habits
    const next = !h.completedToday
    setHabits(previous.map(x => x.id === h.id
      ? { ...x, completedToday: next, recentCount: Math.max(0, x.recentCount + (next ? 1 : -1)) }
      : x))
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
    setCommits(previous.map(x => x.id === c.id ? { ...x, is_completed: next } : x))
    try {
      const res = await fetch(`/api/commitments/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: next }),
      })
      if (!res.ok) setCommits(previous)
    } catch {
      setCommits(previous)
    } finally {
      setPendingCommit(null)
    }
  }

  return (
    <article
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        minHeight: 320,
        overflow: 'hidden',
      }}
    >
      {/* SPRINT M: pin the top stripe to teal so the 4-up palette stays
          violet / gold / blue / teal regardless of the daily-progress
          ring color. Eyebrow continues to flex with progress (dim → teal
          → gold), so the card still communicates state. */}
      <span
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: TEAL }}
      />

      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 16px 8px', gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            margin: 0,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700, fontSize: 9, letterSpacing: '0.32em',
            textTransform: 'uppercase', color: ringColor,
          }}>TODAY</p>
          <h3 style={{
            margin: '4px 0 0',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 22, letterSpacing: '0.04em',
            color: 'var(--text-primary)', textTransform: 'uppercase',
          }}>Daily Pulse</h3>
        </div>
        {/* A2.3: removed the redundant "{totalDone}/{totalSlots}" header pill —
            the aggregate now appears once, beneath the ring as "N/M done". */}
      </header>

      {/* Circle progress */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 16px 10px' }}>
        <div style={{ position: 'relative', width: 116, height: 116 }}>
          <svg width="116" height="116" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            {/* strokeDashoffset is derived from completion state. The
                value is float-precision (circumference × (1 - pct/100))
                and used to surface as a hydration mismatch (#425) when
                React's stringified attribute differed by a sub-pixel
                between SSR and client. Suppress the warning on this
                element only — the visual is identical either way. */}
            <circle
              suppressHydrationWarning
              cx="60" cy="60" r={radius} fill="none"
              stroke={ringColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.2s' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <span style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 38, lineHeight: 1,
              color: 'var(--text-primary)', letterSpacing: '0.02em',
            }}>{formatPct(totalSlots ? totalDone / totalSlots : 0)}</span>
          </div>
        </div>
        {/* A2.3: aggregate shown once beneath the ring as "N/M done"
            (replaces the redundant "{remaining} TO GO" line). */}
        <p style={{
          margin: '8px 0 2px',
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
          fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--text-primary)',
        }}>{formatCount(totalDone, totalSlots, 'done')}</p>
        <p style={{
          margin: 0,
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}>
          {formatCount(habitsDone, HABITS_TOTAL, 'habits')} · {formatCount(commitsDone, COMMITS_TOTAL, 'commits')}
        </p>
      </div>

      {/* Habits */}
      <div style={{ padding: '6px 16px 0' }}>
        <p style={{
          margin: '0 0 4px',
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
          fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}>HABITS</p>
        {habits.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)' }}>No habits set up yet.</p>
        ) : habits.slice(0, 3).map(h => (
          <button
            key={h.id}
            type="button"
            onClick={() => toggleHabit(h)}
            disabled={pendingHabit === h.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 0', textAlign: 'left',
            }}
          >
            <Checkbox checked={h.completedToday} color={GOLD} />
            <span style={{
              flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.4,
              color: h.completedToday ? 'var(--text-tertiary)' : 'var(--text-primary)',
              textDecoration: h.completedToday ? 'line-through' : 'none',
              transition: 'color 0.15s',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{h.name}</span>
            <StreakBadge days={h.recentCount} />
          </button>
        ))}
      </div>

      {/* Commits */}
      <div style={{ padding: '8px 16px 14px' }}>
        <p style={{
          margin: '0 0 4px',
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
          fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}>COMMITS</p>
        {commits.length === 0 ? (
          <Link
            href="/academy/accountability"
            style={{
              display: 'inline-block',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: TEAL, textDecoration: 'none',
            }}
          >+ Add commitment</Link>
        ) : commits.slice(0, COMMITS_TOTAL).map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => toggleCommit(c)}
            disabled={pendingCommit === c.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 0', textAlign: 'left',
            }}
          >
            <Checkbox checked={c.is_completed} color={GOLD} />
            <span style={{
              flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.4,
              color: c.is_completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
              textDecoration: c.is_completed ? 'line-through' : 'none',
              transition: 'color 0.15s',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{c.commitment}</span>
          </button>
        ))}
      </div>
    </article>
  )
}

function Checkbox({ checked, color }: { checked: boolean; color: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0, width: 18, height: 18, borderRadius: 4,
        background: checked ? color : 'transparent',
        border: `2px solid ${checked ? color : 'rgba(255,255,255,0.22)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
          <path d="M2 5.5L4.5 8L9 3" stroke="#0A0F18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )
}

function StreakBadge({ days }: { days: number }) {
  const active = days > 0
  return (
    <span style={{
      flexShrink: 0,
      fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
      fontSize: 10, letterSpacing: '0.08em',
      padding: '2px 7px', borderRadius: 999,
      background: active ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.04)',
      color: active ? GOLD : 'var(--text-tertiary)',
    }}>{days}D</span>
  )
}
