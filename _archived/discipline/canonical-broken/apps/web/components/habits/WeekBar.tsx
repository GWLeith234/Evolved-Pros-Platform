'use client'

import { useEffect, useState } from 'react'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface DayData {
  date: string
  completed: number
  total: number
  pct: number
}

export function WeekBar() {
  const [days, setDays] = useState<DayData[]>([])

  useEffect(() => {
    fetch('/api/habits/history?days=7')
      .then(r => r.json())
      .then(data => setDays(data.daily ?? []))
      .catch(() => {/* silently fail */})
  }, [])

  // Build Mon–Sun aligned display using last 7 days from API
  const today = new Date().toISOString().split('T')[0]

  // Build a map from date string → data
  const byDate: Record<string, DayData> = {}
  for (const d of days) byDate[d.date] = d

  // Build the Mon–Sun week that contains today
  const now = new Date()
  const dow = now.getDay() // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const weekDays: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + mondayOffset + i)
    weekDays.push(d.toISOString().split('T')[0])
  }

  return (
    <div
      className="rounded-lg px-4 py-4"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
    >
      <p
        className="font-condensed font-bold uppercase tracking-[0.18em] mb-4"
        style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}
      >
        This Week
      </p>

      <div className="flex gap-2 justify-between">
        {weekDays.map((date, i) => {
          const data = byDate[date]
          const isToday = date === today
          const isPast = date < today
          const hasDone = (data?.completed ?? 0) > 0

          return (
            <div key={date} className="flex flex-col items-center gap-1.5 flex-1">
              <span
                className="font-condensed font-semibold uppercase"
                style={{ fontSize: '9px', color: isToday ? '#C9A84C' : 'var(--text-tertiary)' }}
              >
                {DAY_LABELS[i]}
              </span>

              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: isToday
                    ? 'rgba(201,168,76,0.15)'
                    : hasDone && isPast
                    ? 'rgba(10,191,163,0.12)'
                    : 'rgba(255,255,255,0.04)',
                  border: isToday
                    ? '1px solid rgba(201,168,76,0.5)'
                    : 'none',
                }}
              >
                {hasDone || isToday ? (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: isToday ? '#C9A84C' : '#0ABFA3',
                      opacity: isToday && !hasDone ? 0.3 : 1,
                    }}
                  />
                ) : null}
              </div>

              {data && data.total > 0 && (
                <span
                  className="font-body"
                  style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}
                >
                  {data.pct}%
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
