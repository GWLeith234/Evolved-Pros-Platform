'use client'

import { useState, useEffect } from 'react'

const TEAL = '#0ABFA3'

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAYS_OF_MONTH = ['1st', '15th', 'Last']
const QUARTER_MONTHS = ['Jan', 'Apr', 'Jul', 'Oct']

type CadenceType = 'weekly' | 'monthly' | 'quarterly'

interface ScheduleJson {
  // weekly
  day_of_week?: string
  // monthly
  day_of_month?: string
  // quarterly
  quarter_month?: string
  // shared
  time?: string
}

interface CadenceRow {
  id: string
  cadence_type: CadenceType
  schedule_json: ScheduleJson
  focus_area: string | null
}

interface Props {
  courseId: string
  initialCadences?: CadenceRow[]
}

// ── Next-date helpers ──────────────────────────────────────────────────────────

function nextWeeklyDate(dayOfWeek: string, time: string): string {
  const dayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }
  const target = dayMap[dayOfWeek] ?? 1
  const now = new Date()
  const diff = ((target - now.getDay()) + 7) % 7 || 7
  const next = new Date(now)
  next.setDate(now.getDate() + diff)
  return next.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) + (time ? ` at ${time}` : '')
}

function nextMonthlyDate(dayOfMonth: string, time: string): string {
  const now = new Date()
  let target: Date
  if (dayOfMonth === '1st') {
    target = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    if (target <= now) target = new Date(now.getFullYear(), now.getMonth() + 2, 1)
  } else if (dayOfMonth === '15th') {
    target = new Date(now.getFullYear(), now.getMonth(), 15)
    if (target <= now) target = new Date(now.getFullYear(), now.getMonth() + 1, 15)
  } else {
    // Last day
    target = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    if (target <= now) target = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  }
  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + (time ? ` at ${time}` : '')
}

function nextQuarterlyDate(quarterMonth: string, time: string): string {
  const monthMap: Record<string, number> = { Jan: 0, Apr: 3, Jul: 6, Oct: 9 }
  const targetMonth = monthMap[quarterMonth] ?? 0
  const now = new Date()
  let year = now.getFullYear()
  let target = new Date(year, targetMonth, 1)
  if (target <= now) {
    // Advance to next occurrence (3 months later, then next full year if needed)
    target = new Date(year, targetMonth + 3, 1)
    if (target.getMonth() !== (targetMonth + 3) % 12) {
      // Overflowed year
      year++
      target = new Date(year, targetMonth, 1)
    }
    if (target <= now) {
      year++
      target = new Date(year, targetMonth, 1)
    }
  }
  return target.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + (time ? ` at ${time}` : '')
}

// ── Single cadence card ────────────────────────────────────────────────────────

interface CardProps {
  type: CadenceType
  title: string
  description: string
  saved: CadenceRow | null
  courseId: string
  onSaved: (row: CadenceRow) => void
}

function CadenceCard({ type, title, description, saved, courseId, onSaved }: CardProps) {
  const init = saved?.schedule_json ?? {}
  const [dayOfWeek, setDayOfWeek] = useState(init.day_of_week ?? 'Mon')
  const [dayOfMonth, setDayOfMonth] = useState(init.day_of_month ?? '1st')
  const [quarterMonth, setQuarterMonth] = useState(init.quarter_month ?? 'Jan')
  const [time, setTime] = useState(init.time ?? '')
  const [focusArea, setFocusArea] = useState(saved?.focus_area ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(!!saved)

  function getNextDate(): string {
    if (type === 'weekly') return nextWeeklyDate(dayOfWeek, time)
    if (type === 'monthly') return nextMonthlyDate(dayOfMonth, time)
    return nextQuarterlyDate(quarterMonth, time)
  }

  function buildScheduleJson(): ScheduleJson {
    const base: ScheduleJson = { time }
    if (type === 'weekly') return { ...base, day_of_week: dayOfWeek }
    if (type === 'monthly') return { ...base, day_of_month: dayOfMonth }
    return { ...base, quarter_month: quarterMonth }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/review-cadences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cadence_type: type,
          schedule_json: buildScheduleJson(),
          focus_area: focusArea,
          course_id: courseId,
        }),
      })
      const data = await res.json() as { cadence?: CadenceRow; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      setIsSaved(true)
      onSaved(data.cadence!)
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#0d1520', border: `1px solid ${isSaved ? TEAL + '30' : 'rgba(255,255,255,0.07)'}`, borderRadius: '8px', padding: '20px 22px', transition: 'border-color 0.2s' }}>
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: TEAL, margin: '0 0 2px' }}>
            {title}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>{description}</p>
        </div>
        {isSaved && (
          <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, backgroundColor: `${TEAL}15`, border: `1px solid ${TEAL}30`, padding: '2px 8px', borderRadius: '20px' }}>
            Saved
          </span>
        )}
      </div>

      {/* Schedule selector */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 0 6px' }}>
          {type === 'weekly' ? 'Day of week' : type === 'monthly' ? 'Day of month' : 'Start month'}
        </p>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(type === 'weekly' ? DAYS_OF_WEEK : type === 'monthly' ? DAYS_OF_MONTH : QUARTER_MONTHS).map(opt => {
            const active = type === 'weekly' ? opt === dayOfWeek : type === 'monthly' ? opt === dayOfMonth : opt === quarterMonth
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  if (type === 'weekly') setDayOfWeek(opt)
                  else if (type === 'monthly') setDayOfMonth(opt)
                  else setQuarterMonth(opt)
                  setIsSaved(false)
                }}
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '5px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                  backgroundColor: active ? TEAL : 'rgba(255,255,255,0.05)',
                  color: active ? '#0A0F18' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.15s',
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time + focus row */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', marginBottom: '14px' }}>
        <div>
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 0 6px' }}>
            Time
          </p>
          <input
            type="text"
            value={time}
            onChange={e => { setTime(e.target.value); setIsSaved(false) }}
            placeholder="6:00 AM"
            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '7px 9px', color: '#faf9f7', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 0 6px' }}>
            Focus area
          </p>
          <input
            type="text"
            value={focusArea}
            onChange={e => { setFocusArea(e.target.value); setIsSaved(false) }}
            placeholder={
              type === 'weekly' ? 'Scoreboard + commitments review'
              : type === 'monthly' ? 'WIG progress + lead measure audit'
              : 'Full EVOLVED Architecture review'
            }
            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '7px 9px', color: '#faf9f7', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Save row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          {isSaved && (
            <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              Next {type} review: <span style={{ color: TEAL }}>{getNextDate()}</span>
            </p>
          )}
          {error && <p style={{ color: '#ef0e30', fontSize: '11px', margin: 0 }}>{error}</p>}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '8px 18px', borderRadius: '4px', border: 'none', cursor: 'pointer',
            backgroundColor: TEAL, color: '#0A0F18', opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving…' : isSaved ? 'Update' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ReviewCadences({ courseId, initialCadences = [] }: Props) {
  const [cadences, setCadences] = useState<CadenceRow[]>(initialCadences)

  // Pre-load saved cadences on mount (handles hard-refresh when initialCadences is empty)
  useEffect(() => {
    if (initialCadences.length > 0) return // server already provided data
    const loadCadences = async () => {
      try {
        const res = await fetch(`/api/review-cadences?course_id=${courseId}`)
        if (!res.ok) return
        const data = await res.json() as { cadences?: CadenceRow[] }
        if (data.cadences && data.cadences.length > 0) {
          setCadences(data.cadences)
        }
      } catch {
        // silently ignore — user can still save fresh cadences
      }
    }
    loadCadences()
  }, [courseId, initialCadences.length])

  function getSaved(type: CadenceType): CadenceRow | null {
    return cadences.find(c => c.cadence_type === type) ?? null
  }

  function handleSaved(row: CadenceRow) {
    setCadences(prev => {
      const filtered = prev.filter(c => c.cadence_type !== row.cadence_type)
      return [...filtered, row]
    })
  }

  const CARDS: { type: CadenceType; title: string; description: string }[] = [
    { type: 'weekly',    title: 'Weekly Review',    description: 'Scoreboard, commitments, lead measures — every week without exception.' },
    { type: 'monthly',   title: 'Monthly Review',   description: 'WIG progress audit + recalibrate your lead measure targets.' },
    { type: 'quarterly', title: 'Quarterly Review', description: 'Full EVOLVED Architecture review — strategy, identity, and execution.' },
  ]

  return (
    <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: TEAL, margin: '0 0 4px' }}>
          Review Cadences
        </p>
        <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>
          Schedule your performance reviews
        </p>
        <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '13px', margin: 0 }}>
          Elite performers review consistently. Set your rhythm once — then protect it.
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {CARDS.map(card => (
          <CadenceCard
            key={getSaved(card.type)?.id ?? card.type}
            type={card.type}
            title={card.title}
            description={card.description}
            saved={getSaved(card.type)}
            courseId={courseId}
            onSaved={handleSaved}
          />
        ))}
      </div>
    </div>
  )
}
