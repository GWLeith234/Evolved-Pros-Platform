'use client'

import { useState, useEffect, useMemo } from 'react'
import type { EventItem } from '@/lib/events/types'

interface CalendarStripProps {
  events: EventItem[]
  onDayClick?: (date: Date) => void
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function CalendarStrip({ events, onDayClick }: CalendarStripProps) {
  // SPRINT O: defer BOTH today and viewDate to useEffect — the previous
  // useState lazy initializer ran new Date() on the server AND on first
  // client render, producing different values (server is UTC) and tripping
  // React #425. Render nothing until we've got a client-side viewDate.
  const [today, setToday] = useState<Date | null>(null)
  const [viewDate, setViewDate] = useState<Date | null>(null)

  useEffect(() => {
    const now = new Date()
    setToday(now)
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1))
  }, [])

  // Event days set for the displayed month
  const eventDays = useMemo(() => {
    if (!viewDate) return new Set()
    const set = new Set<number>()
    for (const e of events) {
      const d = new Date(e.startsAt)
      if (d.getFullYear() === viewDate.getFullYear() && d.getMonth() === viewDate.getMonth()) {
        set.add(d.getDate())
      }
    }
    return set
  }, [events, viewDate])

  // Render nothing until the client-side viewDate is set (deferred to useEffect
  // above to avoid the #425 hydration mismatch). Guard placed after all hooks.
  if (!viewDate) return null

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  // Build grid cells
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1))
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1))
  }

  const isCurrentMonth = today !== null && today.getFullYear() === year && today.getMonth() === month

  return (
    <div
      className="rounded-lg mb-5"
      style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.12)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}
      >
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded border font-condensed text-[12px] text-[#1b3c5a] transition-colors hover:bg-[rgba(27,60,90,0.06)]"
          style={{ borderColor: 'rgba(27,60,90,0.2)' }}
        >
          ←
        </button>
        <span className="font-condensed font-bold text-[13px] uppercase tracking-wide text-[#1b3c5a]">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded border font-condensed text-[12px] text-[#1b3c5a] transition-colors hover:bg-[rgba(27,60,90,0.06)]"
          style={{ borderColor: 'rgba(27,60,90,0.2)' }}
        >
          →
        </button>
      </div>

      <div className="px-4 py-3">
        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center font-condensed font-bold uppercase text-[12px] text-[#7a8a96] py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />
            const isToday = isCurrentMonth && today !== null && day === today.getDate()
            const hasEvent = eventDays.has(day)
            const clickable = hasEvent && onDayClick

            return (
              <div
                key={day}
                className="flex flex-col items-center justify-center"
                style={{ height: '32px' }}
              >
                <button
                  onClick={() => {
                    if (clickable) onDayClick(new Date(year, month, day))
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded text-[13px] font-body font-medium transition-colors"
                  style={{
                    backgroundColor: isToday ? '#ef0e30' : 'transparent',
                    color: isToday ? 'white' : '#1b3c5a',
                    cursor: hasEvent ? 'pointer' : 'default',
                  }}
                  disabled={!hasEvent}
                >
                  {day}
                </button>
                {hasEvent && (
                  <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: '#68a2b9' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
