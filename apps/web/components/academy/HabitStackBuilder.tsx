'use client'

import { useState, useEffect, useCallback } from 'react'

const TEAL = '#0ABFA3'
const MAX_HABITS = 7

type TimeOfDay = 'AM' | 'Midday' | 'PM' | 'Evening'
const TIME_OPTIONS: TimeOfDay[] = ['AM', 'Midday', 'PM', 'Evening']

const TIME_COLORS: Record<TimeOfDay, string> = {
  AM:      '#C9A84C',
  Midday:  '#60A5FA',
  PM:      '#F87171',
  Evening: '#A78BFA',
}

interface HabitRow {
  id: string
  name: string
  time_of_day: string
  sort_order: number
  course_id: string | null
  created_at: string
}

interface Props {
  courseId: string
  initialHabits?: HabitRow[]
  initialCompletions?: string[]
}

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const r = 28
  const circumference = 2 * Math.PI * r
  const pct = total > 0 ? completed / total : 0
  const dash = circumference * pct
  const gap = circumference - dash

  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={TEAL} strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: '18px', color: total > 0 && completed === total ? TEAL : '#faf9f7', lineHeight: 1 }}>
          {completed}
        </span>
        <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.3)', lineHeight: 1, marginTop: '1px' }}>
          / {total}
        </span>
      </div>
    </div>
  )
}

export function HabitStackBuilder({ courseId, initialHabits, initialCompletions }: Props) {
  const [habits, setHabits] = useState<HabitRow[]>(initialHabits ?? [])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set(initialCompletions ?? []))
  const [loading, setLoading] = useState(!initialHabits)
  const [editMode, setEditMode] = useState(false)

  // Form state
  const [newName, setNewName] = useState('')
  const [newTime, setNewTime] = useState<TimeOfDay>('AM')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const fetchHabits = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/habits?course_id=${courseId}`)
      if (!res.ok) return
      const data = await res.json() as { habits: HabitRow[]; completedIds: string[] }
      setHabits(data.habits)
      setCompletedIds(new Set(data.completedIds))
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    if (!initialHabits) {
      fetchHabits()
    }
  }, [fetchHabits, initialHabits])

  // Determine view: show builder if no habits or in editMode
  const showBuilder = habits.length === 0 || editMode

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    setAddError(null)
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, time_of_day: newTime, course_id: courseId }),
      })
      const data = await res.json() as { habit?: HabitRow; error?: string }
      if (!res.ok) { setAddError(data.error ?? 'Failed to add'); return }
      setHabits(prev => [...prev, data.habit!])
      setNewName('')
    } catch {
      setAddError('Network error')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    setHabits(prev => prev.filter(h => h.id !== id))
    await fetch(`/api/habits?id=${id}`, { method: 'DELETE' })
  }

  async function handleToggle(id: string) {
    const wasComplete = completedIds.has(id)
    if (wasComplete) return // can't un-complete (idempotent)
    setCompletedIds(prev => new Set([...prev, id]))
    await fetch(`/api/habits/${id}/complete`, { method: 'POST' })
  }

  const completedCount = habits.filter(h => completedIds.has(h.id)).length
  const allComplete = habits.length > 0 && completedCount === habits.length
  const atMax = habits.length >= MAX_HABITS

  if (loading) {
    return (
      <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '24px 28px' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center' }}>Loading habit stack…</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: TEAL, margin: '0 0 4px' }}>
            Habit Stack Builder
          </p>
          <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: 0 }}>
            {showBuilder ? 'Build your daily stack' : 'Daily check-off'}
          </p>
        </div>
        {habits.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ProgressRing completed={completedCount} total={habits.length} />
            {!showBuilder && (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                EDIT
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Builder mode ── */}
      {showBuilder && (
        <>
          {/* Add form */}
          {!atMax ? (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
                placeholder="Habit name…"
                style={{ flex: '1 1 160px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '8px 10px', color: '#faf9f7', fontSize: '13px', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                {TIME_OPTIONS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewTime(t)}
                    style={{
                      fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px',
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '8px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                      backgroundColor: newTime === t ? TIME_COLORS[t] + '22' : 'rgba(255,255,255,0.04)',
                      color: newTime === t ? TIME_COLORS[t] : 'rgba(255,255,255,0.35)',
                      outline: newTime === t ? `1px solid ${TIME_COLORS[t]}55` : 'none',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newName.trim() || adding}
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: newName.trim() ? 'pointer' : 'default',
                  backgroundColor: newName.trim() ? TEAL : 'rgba(255,255,255,0.06)',
                  color: newName.trim() ? '#0A0F18' : 'rgba(255,255,255,0.25)',
                }}
              >
                {adding ? '…' : '+ Add'}
              </button>
            </div>
          ) : (
            <div style={{ padding: '10px 14px', backgroundColor: `${TEAL}0D`, border: `1px solid ${TEAL}22`, borderRadius: '4px', marginBottom: '16px' }}>
              <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '12px', color: TEAL, margin: 0 }}>
                You&apos;ve built your full stack — {MAX_HABITS} habits locked in.
              </p>
            </div>
          )}
          {addError && <p style={{ color: '#ef0e30', fontSize: '12px', marginBottom: '8px' }}>{addError}</p>}

          {/* Habit list — builder mode */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {habits.map(h => (
              <div
                key={h.id}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '10px 12px' }}
              >
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', cursor: 'grab', flexShrink: 0 }}>⠿</span>
                <span
                  style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: TIME_COLORS[h.time_of_day as TimeOfDay] ?? 'rgba(255,255,255,0.4)', backgroundColor: `${TIME_COLORS[h.time_of_day as TimeOfDay] ?? '#fff'}14`, padding: '2px 7px', borderRadius: '20px', flexShrink: 0 }}
                >
                  {h.time_of_day}
                </span>
                <span style={{ flex: 1, color: '#faf9f7', fontSize: '13px' }}>{h.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(h.id)}
                  style={{ color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef0e30')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
                  aria-label={`Delete ${h.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Done editing */}
          {habits.length > 0 && editMode && (
            <button
              type="button"
              onClick={() => setEditMode(false)}
              style={{ marginTop: '16px', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', backgroundColor: TEAL, color: '#0A0F18', border: 'none', borderRadius: '4px', padding: '10px 20px', cursor: 'pointer' }}
            >
              Done →
            </button>
          )}
        </>
      )}

      {/* ── Check-off mode ── */}
      {!showBuilder && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {habits.map(h => {
              const done = completedIds.has(h.id)
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleToggle(h.id)}
                  disabled={done}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    backgroundColor: done ? `${TEAL}0D` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${done ? TEAL + '30' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: '6px', padding: '11px 14px',
                    cursor: done ? 'default' : 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${done ? TEAL : 'rgba(255,255,255,0.2)'}`, backgroundColor: done ? TEAL : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                    {done && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="#0A0F18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Time badge */}
                  <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: TIME_COLORS[h.time_of_day as TimeOfDay] ?? 'rgba(255,255,255,0.4)', backgroundColor: `${TIME_COLORS[h.time_of_day as TimeOfDay] ?? '#fff'}14`, padding: '2px 7px', borderRadius: '20px', flexShrink: 0 }}>
                    {h.time_of_day}
                  </span>

                  {/* Name */}
                  <span style={{ flex: 1, color: done ? 'rgba(255,255,255,0.35)' : '#faf9f7', fontSize: '13px', textDecoration: done ? 'line-through' : 'none', transition: 'all 0.2s' }}>
                    {h.name}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Motivational complete line */}
          {allComplete && (
            <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: `${TEAL}15`, border: `1px solid ${TEAL}40`, borderRadius: '6px', textAlign: 'center' }}>
              <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL, margin: 0 }}>
                Stack complete. Go execute.
              </p>
            </div>
          )}

          {/* Reset link */}
          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => setEditMode(true)}
              style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              EDIT STACK
            </button>
          </div>
        </>
      )}
    </div>
  )
}
