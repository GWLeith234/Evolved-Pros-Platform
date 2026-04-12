'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

const TEAL = '#0ABFA3'

type TimeOfDay = 'AM' | 'Midday' | 'PM' | 'Evening'
const TIME_COLORS: Record<string, string> = {
  AM:      '#C9A84C',
  Midday:  '#60A5FA',
  PM:      '#F87171',
  Evening: '#A78BFA',
}

interface HabitRow {
  id: string
  name: string
  time_of_day: string
}

interface Props {
  initialHabits: HabitRow[]
  initialCompletions: string[]
}

export function HabitWidget({ initialHabits, initialCompletions }: Props) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set(initialCompletions))

  async function handleToggle(id: string) {
    if (completedIds.has(id)) return
    setCompletedIds(prev => new Set([...prev, id]))
    await fetch(`/api/habits/${id}/complete`, {
      method: 'POST',
      headers: { 'x-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone },
    })
  }

  const completed = initialHabits.filter(h => completedIds.has(h.id)).length
  const total = initialHabits.length
  const pct = total > 0 ? (completed / total) * 100 : 0
  const allDone = completed === total

  if (total === 0) {
    return (
      <div style={{ backgroundColor: 'var(--bg-surface)', border: `1px solid ${TEAL}22`, borderRadius: '8px', padding: '16px 18px' }}>
        <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: `${TEAL}88`, margin: '0 0 6px' }}>
          Habit Stack
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', margin: '0 0 10px', lineHeight: 1.5 }}>
          Build your daily execution habits.
        </p>
        <Button variant="tertiary" size="sm" href="/academy/execution">
          Build your habit stack
        </Button>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', border: `1px solid ${TEAL}22`, borderRadius: '8px', overflow: 'hidden' }}>
      {/* Teal progress bar at top */}
      <div style={{ height: '2px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <div style={{ height: '2px', width: `${pct}%`, backgroundColor: TEAL, transition: 'width 0.3s' }} />
      </div>

      <div style={{ padding: '14px 18px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: TEAL, margin: 0 }}>
            Habit Stack
          </p>
          <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '12px', color: allDone ? TEAL : 'var(--text-tertiary)' }}>
            {completed}/{total}
          </span>
        </div>

        {/* Habit list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {initialHabits.map(h => {
            const done = completedIds.has(h.id)
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => handleToggle(h.id)}
                disabled={done}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', padding: '2px 0', cursor: done ? 'default' : 'pointer', textAlign: 'left', width: '100%' }}
              >
                {/* Mini checkbox */}
                <div style={{ width: '16px', height: '16px', borderRadius: '3px', border: `1.5px solid ${done ? TEAL : 'rgba(255,255,255,0.2)'}`, backgroundColor: done ? TEAL : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {done && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1 4.5L3.5 7L8 1.5" stroke="#0A0F18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                {/* Time badge */}
                <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '8px', letterSpacing: '0.08em', textTransform: 'uppercase', color: TIME_COLORS[h.time_of_day as TimeOfDay] ?? 'rgba(255,255,255,0.3)', backgroundColor: `${TIME_COLORS[h.time_of_day as TimeOfDay] ?? '#fff'}14`, padding: '1px 5px', borderRadius: '10px', flexShrink: 0 }}>
                  {h.time_of_day}
                </span>
                <span style={{ color: done ? 'var(--text-tertiary)' : 'var(--text-primary)', fontSize: '12px', textDecoration: done ? 'line-through' : 'none', transition: 'all 0.15s', flex: 1 }}>
                  {h.name}
                </span>
              </button>
            )
          })}
        </div>

        {allDone && (
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, margin: '10px 0 0', textAlign: 'center' }}>
            Stack complete. Go execute.
          </p>
        )}

        <Button variant="tertiary" size="sm" href="/academy/execution">
          Manage stack
        </Button>
      </div>
    </div>
  )
}
