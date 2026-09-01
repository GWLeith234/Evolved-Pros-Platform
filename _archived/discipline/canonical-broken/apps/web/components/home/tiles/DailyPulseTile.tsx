// HOME-4UP-TILES: ports DailyPulseCard from home-tiles.jsx (lines 455-549).
// Daily ring (60% completion) + "X TO GO" / "Y/N habits · M/N commits" line +
// Habits subsection (with streak chip) + Commitments subsection (checkboxes).
//
// 'use client' — checkbox toggles use optimistic local state.
// Real habit/commitment toggle wiring is out of scope; the buttons
// flip local state only and don't persist (visual affordance + future
// hookup).

'use client'

import { useState } from 'react'
import { TileCard } from './TileCard'

const ACCENT = 'var(--tile-discipline)'

export interface PulseHabit {
  id: string
  label: string
  /** Pillar accent color for the streak chip + active checkbox. */
  pillarColor: string
  streakDays: number
  doneToday: boolean
}

export interface PulseCommitment {
  id: string
  text: string
  doneToday: boolean
}

interface DailyPulseTileProps {
  habits: PulseHabit[]
  commitments: PulseCommitment[]
}

function CheckBox({
  checked,
  accent,
  onClick,
}: {
  checked: boolean
  accent: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
      aria-pressed={checked}
      style={{
        width: 18,
        height: 18,
        background: checked ? accent : 'transparent',
        border: `1.5px solid ${checked ? accent : 'var(--border-color)'}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 120ms ease',
      }}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#0A0F18" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2.5 6 L5 8.5 L9.5 3.5" />
        </svg>
      )}
    </button>
  )
}

function DailyRing({ pct }: { pct: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  return (
    <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border-color)" strokeWidth="3" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="#19C9A6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: 'stroke-dasharray 280ms ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 22,
            color: 'var(--text-primary)',
            letterSpacing: '0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {pct}
        </span>
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 8,
            letterSpacing: '0.2em',
            color: '#19C9A6',
          }}
        >
          %
        </span>
      </div>
    </div>
  )
}

export function DailyPulseTile({ habits: initialHabits, commitments: initialCommitments }: DailyPulseTileProps) {
  const [habits, setHabits] = useState(initialHabits)
  const [commits, setCommits] = useState(initialCommitments)

  const toggleHabit = (id: string) =>
    setHabits(prev => prev.map(h => (h.id === id ? { ...h, doneToday: !h.doneToday } : h)))
  const toggleCommit = (id: string) =>
    setCommits(prev => prev.map(c => (c.id === id ? { ...c, doneToday: !c.doneToday } : c)))

  const habitsDone = habits.filter(h => h.doneToday).length
  const commitsDone = commits.filter(c => c.doneToday).length
  const totalDone = habitsDone + commitsDone
  const totalAll = habits.length + commits.length
  const pct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0

  // Empty state — no habits or commitments set up yet
  if (totalAll === 0) {
    return (
      <TileCard accent={ACCENT} eyebrow="Today" title="Daily Pulse" count="0/0">
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'center' }}>
          <p
            style={{
              margin: 0,
              fontFamily: '"Barlow", sans-serif',
              fontSize: 12,
              color: 'var(--text-tertiary)',
              lineHeight: 1.4,
            }}
          >
            Build your daily habit stack to track streaks here.
          </p>
          <a
            href="/discipline"
            style={{
              display: 'inline-block',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: ACCENT,
              textDecoration: 'none',
            }}
          >
            Set your first habit →
          </a>
        </div>
      </TileCard>
    )
  }

  return (
    <TileCard
      accent={ACCENT}
      eyebrow="Today"
      title="Daily Pulse"
      count={`${totalDone}/${totalAll}`}
    >
      {/* Big progress ring + scoreboard */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '8px 16px 14px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <DailyRing pct={pct} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p
            style={{
              margin: 0,
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
            }}
          >
            {pct === 100 ? 'Day complete' : `${totalAll - totalDone} to go`}
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 18,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
            }}
          >
            {habitsDone}/{habits.length} habits · {commitsDone}/{commits.length} commits
          </p>
        </div>
      </div>

      {/* Habits */}
      {habits.length > 0 && (
        <div style={{ padding: '8px 16px 0' }}>
          <p
            style={{
              margin: '0 0 6px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: 9,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
            }}
          >
            Habits
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {habits.map(h => (
              <li key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckBox checked={h.doneToday} accent={h.pillarColor} onClick={() => toggleHabit(h.id)} />
                <span
                  style={{
                    flex: 1,
                    fontFamily: '"Barlow", sans-serif',
                    fontSize: 12,
                    color: h.doneToday ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: h.doneToday ? 'line-through' : 'none',
                  }}
                >
                  {h.label}
                </span>
                <span
                  style={{
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 700,
                    fontSize: 9,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: h.pillarColor,
                  }}
                >
                  🔥 {h.streakDays}d
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Commitments */}
      {commits.length > 0 && (
        <div style={{ padding: '8px 16px 12px' }}>
          <p
            style={{
              margin: '0 0 6px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: 9,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
            }}
          >
            Commitments
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {commits.map(c => (
              <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckBox checked={c.doneToday} accent={ACCENT} onClick={() => toggleCommit(c.id)} />
                <span
                  style={{
                    flex: 1,
                    fontFamily: '"Barlow", sans-serif',
                    fontSize: 12,
                    color: c.doneToday ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: c.doneToday ? 'line-through' : 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {c.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </TileCard>
  )
}
