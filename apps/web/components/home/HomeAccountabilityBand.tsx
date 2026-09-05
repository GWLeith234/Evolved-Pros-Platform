'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPct } from '@/lib/format'
import { leadingMeasureStatus, weeklyCommitPulse } from '@/lib/home/bands'
import type { DailyPulseHabit, DailyPulseCommitment } from './DailyPulseCard'

interface HomeAccountabilityBandProps {
  habits: DailyPulseHabit[]
  commitments: DailyPulseCommitment[]
}

export function HomeAccountabilityBand({
  habits: initialHabits,
  commitments: initialCommits,
}: HomeAccountabilityBandProps) {
  const [habits, setHabits] = useState(initialHabits)
  const [commits, setCommits] = useState(initialCommits)
  const [pendingHabit, setPendingHabit] = useState<string | null>(null)
  const [pendingCommit, setPendingCommit] = useState<string | null>(null)

  const habitsDone = habits.filter(h => h.completedToday).length
  const commitsDone = commits.filter(c => c.is_completed).length
  const pulseSlots = commits.length > 0 ? commits.length : habits.length
  const pulseDone = commits.length > 0 ? commitsDone : habitsDone
  const pulse = weeklyCommitPulse(pulseDone, pulseSlots)

  async function toggleHabit(h: DailyPulseHabit) {
    if (pendingHabit === h.id) return
    setPendingHabit(h.id)
    const previous = habits
    const next = !h.completedToday
    setHabits(previous.map(x => (x.id === h.id ? { ...x, completedToday: next } : x)))
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
    setCommits(previous.map(x => (x.id === c.id ? { ...x, is_completed: next } : x)))
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
    <section
      aria-label="Leading measures"
      className="ep-surface-card overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div
        className="flex flex-wrap items-start justify-between gap-4"
        style={{
          padding: 'var(--space-4) var(--space-card-lg, 24px)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div>
          <p className="font-condensed text-ep-label font-bold uppercase tracking-[0.18em] m-0" style={{ color: 'var(--teal)' }}>
            Accountability
          </p>
          <h2 className="font-bebas text-[26px] leading-none tracking-[0.04em] uppercase text-primary mt-1 mb-0">
            Leading measures
          </h2>
          <p className="font-body text-ep-body-sm text-secondary m-0 mt-2">
            Daily habits that move the WIG. Weekly commits keep the pulse honest.
          </p>
        </div>
        <div
          className="shrink-0 px-3 py-2"
          style={{
            border: '1px solid var(--success-green)',
            color: 'var(--success-green)',
          }}
        >
          <p className="font-condensed text-ep-label font-extrabold uppercase tracking-[0.16em] m-0">
            {formatPct(pulse / 100)} weekly commit pulse
          </p>
        </div>
      </div>

      <div style={{ padding: 'var(--space-4) var(--space-card-lg, 24px) var(--space-6)' }}>
        {habits.length === 0 && commits.length === 0 ? (
          <p className="font-body text-ep-body-sm text-secondary m-0">
            No leading measures yet.{' '}
            <Link href="/academy/accountability" style={{ color: 'var(--teal)' }}>
              Build your stack
            </Link>
          </p>
        ) : (
          <ul className="m-0 p-0 list-none ep-stack--tight">
            {habits.slice(0, 5).map(h => {
              const status = leadingMeasureStatus(h.completedToday)
              return (
                <li
                  key={h.id}
                  className="flex items-center gap-3"
                  style={{
                    paddingBottom: 'var(--space-4)',
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
                    className="ep-pressable flex items-center justify-center shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <MeasureBox checked={h.completedToday} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-body text-[14px] m-0"
                      style={{
                        color: h.completedToday ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        textDecoration: h.completedToday ? 'line-through' : 'none',
                      }}
                    >
                      {h.name}
                    </p>
                    <p className="font-condensed text-[11px] font-semibold uppercase tracking-[0.08em] text-tertiary m-0 mt-1">
                      Lead tied to WIG
                    </p>
                  </div>
                  <span
                    className="font-condensed text-[11px] font-extrabold uppercase tracking-[0.12em] shrink-0"
                    style={{
                      color: h.completedToday ? 'var(--success-green)' : 'var(--text-secondary)',
                    }}
                  >
                    {status.label} · {status.fraction}
                  </span>
                </li>
              )
            })}

            {commits.slice(0, 3).map(c => {
              const status = leadingMeasureStatus(c.is_completed)
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3"
                  style={{
                    paddingBottom: 'var(--space-4)',
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
                    className="ep-pressable flex items-center justify-center shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <MeasureBox checked={c.is_completed} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-body text-[14px] m-0"
                      style={{
                        color: c.is_completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        textDecoration: c.is_completed ? 'line-through' : 'none',
                      }}
                    >
                      {c.commitment}
                    </p>
                    <p className="font-condensed text-[11px] font-semibold uppercase tracking-[0.08em] text-tertiary m-0 mt-1">
                      Weekly commit
                    </p>
                  </div>
                  <span
                    className="font-condensed text-[11px] font-extrabold uppercase tracking-[0.12em] shrink-0"
                    style={{
                      color: c.is_completed ? 'var(--success-green)' : 'var(--text-secondary)',
                    }}
                  >
                    {status.label} · {status.fraction}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

function MeasureBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className="flex items-center justify-center"
      style={{
        width: 18,
        height: 18,
        background: checked ? 'var(--teal)' : 'transparent',
        border: `2px solid ${checked ? 'var(--teal)' : 'var(--text-tertiary)'}`,
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
          <path
            d="M2 5.5L4.5 8L9 3"
            stroke="var(--bg-page)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}
