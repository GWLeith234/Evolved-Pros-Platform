'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { TileCard } from './tiles/TileCard'
import { TileRow, TileFooterLink } from './tiles/TileRow'
import { ConfettiBlast } from '@/components/ui/ConfettiBlast'
import { formatPct, formatCount } from '@/lib/format'

// Brand palette for the all-done confetti burst (theme-invariant accents).
const CELEBRATE_COLORS = ['#C9A84C', '#0ABFA3', '#C9302A', '#A78BFA', '#60A5FA']

const GOLD = '#C9A84C'
const TEAL = '#0ABFA3'
const DIM  = 'var(--text-tertiary)'

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
  // Micro-interactions: id of the row just checked (drives the checkbox pop +
  // streak bump), and a one-shot celebration when the card reaches 100%.
  const [justChecked, setJustChecked] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState(false)

  const habitsDone  = habits.filter(h => h.completedToday).length
  const commitsDone = commits.filter(c => c.is_completed).length
  const totalSlots  = HABITS_TOTAL + COMMITS_TOTAL
  const totalDone   = habitsDone + commitsDone
  const pct         = totalSlots ? Math.round((totalDone / totalSlots) * 100) : 0

  const ringColor = pct >= 100 ? GOLD : pct > 0 ? TEAL : DIM
  const allDone   = totalSlots > 0 && totalDone === totalSlots

  // Fire the confetti burst only on the transition INTO all-done, never on
  // every re-render while complete (which would loop) or on initial mount.
  const wasAllDone = useRef(allDone)
  useEffect(() => {
    if (allDone && !wasAllDone.current) setCelebrate(true)
    wasAllDone.current = allDone
  }, [allDone])

  // Flag a row as "just checked" for ~600ms so its checkbox pops + glows and
  // its streak badge bumps, then clears so the animation can retrigger later.
  function flashCheck(id: string) {
    setJustChecked(id)
    setTimeout(() => setJustChecked(prev => (prev === id ? null : prev)), 600)
  }

  // SVG ring math (r=46, viewbox=120)
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(100, Math.max(0, pct)) / 100)

  async function toggleHabit(h: DailyPulseHabit) {
    if (pendingHabit === h.id) return
    setPendingHabit(h.id)
    const previous = habits
    const next = !h.completedToday
    if (next) flashCheck(h.id)
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
    if (next) flashCheck(c.id)
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

  // SPRINT 1 (A1.1): the daily-progress fraction is NOT a header badge — it
  // lives in the body ring below. The status pill's only role across the 4-up
  // is a "N NEW" since-last-visit count, which Daily Pulse has no source for,
  // so the pill is omitted (newCount left undefined).
  // SPRINT M: stripe pinned to teal so the 4-up palette stays
  // violet / gold / blue / teal; the eyebrow still flexes with progress
  // (dim → teal → gold) via eyebrowColor, so the card communicates state.
  return (
    <TileCard
      accent={TEAL}
      eyebrowColor={ringColor}
      eyebrow="Discipline"
      title="Daily pulse"
      footer={<TileFooterLink href="/academy/accountability">All habits</TileFooterLink>}
    >
      {/* All-day-complete celebration — reuses the shared reduced-motion-aware
          confetti; onComplete resets so it can fire again tomorrow. */}
      <ConfettiBlast active={celebrate} colors={CELEBRATE_COLORS} onComplete={() => setCelebrate(false)} />
      {/* Circle progress */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 16px 10px' }}>
        <div style={{ position: 'relative', width: 116, height: 116 }}>
          <svg width="116" height="116" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--border-color)" strokeWidth="8" />
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
              style={{
                transition: 'stroke-dashoffset 0.4s ease, stroke 0.2s',
                // Celebratory glow the moment every slot is complete.
                animation: allDone ? 'ep-ring-glow 1.6s ease-in-out 2' : undefined,
                filter: allDone ? 'drop-shadow(0 0 4px rgba(201,168,76,0.7))' : undefined,
              }}
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

      {/* Habits — one TileRow each: checkbox (leading) · habit (primary) ·
          no meta · streak pill (trailing). */}
      <div style={{ padding: '6px 16px 0' }}>
        <p style={{
          margin: '0 0 4px',
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
          fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}>HABITS</p>
        {habits.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)' }}>No habits set up yet.</p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {habits.slice(0, 3).map((h, i) => (
              <TileRow
                key={h.id}
                isFirst={i === 0}
                align="center"
                leading={
                  <button
                    type="button"
                    onClick={() => toggleHabit(h)}
                    disabled={pendingHabit === h.id}
                    aria-label={h.completedToday ? `Mark ${h.name} incomplete` : `Mark ${h.name} complete`}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                    }}
                  >
                    <Checkbox checked={h.completedToday} color={GOLD} pop={justChecked === h.id} />
                  </button>
                }
                primary={
                  <span style={{
                    display: 'block', fontSize: 13, lineHeight: 1.4,
                    color: h.completedToday ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: h.completedToday ? 'line-through' : 'none',
                    transition: 'color 0.15s',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{h.name}</span>
                }
                trailing={<StreakBadge days={h.recentCount} bump={justChecked === h.id} />}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Commits — same row template (checkbox · commitment), plus the
          in-body "+ Add commitment" action ABOVE the footer (A1.3). */}
      <div style={{ padding: '8px 16px 14px' }}>
        <p style={{
          margin: '0 0 4px',
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
          fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}>COMMITS</p>
        {commits.length > 0 && (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {commits.slice(0, COMMITS_TOTAL).map((c, i) => (
              <TileRow
                key={c.id}
                isFirst={i === 0}
                align="center"
                leading={
                  <button
                    type="button"
                    onClick={() => toggleCommit(c)}
                    disabled={pendingCommit === c.id}
                    aria-label={c.is_completed ? `Mark ${c.commitment} incomplete` : `Mark ${c.commitment} complete`}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                    }}
                  >
                    <Checkbox checked={c.is_completed} color={GOLD} pop={justChecked === c.id} />
                  </button>
                }
                primary={
                  <span style={{
                    display: 'block', fontSize: 13, lineHeight: 1.4,
                    color: c.is_completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: c.is_completed ? 'line-through' : 'none',
                    transition: 'color 0.15s',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{c.commitment}</span>
                }
              />
            ))}
          </ul>
        )}
        <Link
          href="/academy/accountability"
          style={{
            display: 'inline-block', marginTop: commits.length > 0 ? 8 : 0,
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: TEAL, textDecoration: 'none',
          }}
        >+ Add commitment</Link>
      </div>
    </TileCard>
  )
}

function Checkbox({ checked, color, pop }: { checked: boolean; color: string; pop?: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0, width: 18, height: 18, borderRadius: 0,
        background: checked ? color : 'transparent',
        border: `2px solid ${checked ? color : 'var(--text-tertiary)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
        // Satisfying pop + accent glow the moment it's checked.
        animation: pop ? 'ep-check-pop 0.4s ease, ep-check-glow 0.6s ease' : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...( { ['--ep-glow']: 'rgba(201,168,76,0.55)' } as any ),
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

function StreakBadge({ days, bump }: { days: number; bump?: boolean }) {
  const active = days > 0
  return (
    <span style={{
      flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
      fontSize: 10, letterSpacing: '0.08em',
      padding: '2px 7px', borderRadius: 0,
      background: active ? 'rgba(201,168,76,0.14)' : 'var(--bg-elevated)',
      color: active ? GOLD : 'var(--text-tertiary)',
      // Bump when the streak ticks up on check.
      animation: bump ? 'ep-streak-pop 0.5s ease' : undefined,
    }}>
      {active && <span aria-hidden="true" style={{ fontSize: 9, lineHeight: 1 }}>🔥</span>}
      {days}D
    </span>
  )
}
