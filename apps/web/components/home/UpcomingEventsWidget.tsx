'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardBody } from '@evolved-pros/ui'

type EventRow = {
  id: string
  title: string
  description: string | null
  event_type: string
  starts_at: string
  ends_at: string | null
  zoom_url: string | null
  required_tier: string | null
  isRegistered: boolean
}

interface UpcomingEventsWidgetProps {
  events: EventRow[]
  userId: string
}

const MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

function formatDuration(starts: string, ends: string | null): string {
  const start = new Date(starts)
  const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
  if (!ends) return timeStr
  const end = new Date(ends)
  const diffMs = end.getTime() - start.getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${timeStr} · ${mins}m`
  return `${timeStr} · ${Math.round(mins / 60)}h`
}

function EventItem({ event, userId }: { event: EventRow; userId: string }) {
  const [registered, setRegistered] = useState(event.isRegistered)
  const [loading, setLoading] = useState(false)
  // Defer toLocaleTimeString to client-only — timeZoneName: 'short' produces different output
  // on server (UTC → "12:00 PM UTC") vs browser (local tz → "8:00 AM EDT") — hydration error #425
  const [durationStr, setDurationStr] = useState('')
  useEffect(() => { setDurationStr(formatDuration(event.starts_at, event.ends_at)) }, [event.starts_at, event.ends_at])

  const date = new Date(event.starts_at)
  const day = date.getDate()
  const month = MONTH_ABBR[date.getMonth()]
  const platform = event.event_type === 'virtual' ? 'Zoom' : event.event_type === 'live' ? 'Live' : 'In-Person'

  async function handleRegister() {
    if (registered) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('event_registrations')
      .insert({ event_id: event.id, user_id: userId })
    if (!error) setRegistered(true)
    setLoading(false)
  }

  return (
    <div className="flex items-start gap-4 py-4">
      {/* Date block */}
      <div className="flex-shrink-0 flex flex-col items-center w-10">
        <span
          className="font-display font-black leading-none text-[26px]"
          style={{ color: '#112535' }}
        >
          {day}
        </span>
        <span
          className="font-condensed font-bold uppercase text-[10px] tracking-wide"
          style={{ color: '#ef0e30' }}
        >
          {month}
        </span>
      </div>

      {/* Event info */}
      <div className="flex-1 min-w-0">
        <p className="font-body font-semibold text-[13px] text-[#1b3c5a] leading-tight mb-0.5">
          {event.title}
        </p>
        <p className="font-condensed text-[11px] font-medium text-[#7a8a96]">
          {durationStr} · {platform}
        </p>
      </div>

      {/* Action */}
      <button
        onClick={handleRegister}
        disabled={registered || loading}
        className="flex-shrink-0 font-condensed font-semibold uppercase tracking-wide text-xs rounded px-3 py-1.5 transition-all"
        style={registered
          ? { backgroundColor: '#68a2b9', color: 'white', border: '1px solid #68a2b9' }
          : { backgroundColor: 'transparent', color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.3)' }
        }
      >
        {loading ? '...' : registered ? 'Registered' : 'Register'}
      </button>
    </div>
  )
}

export function UpcomingEventsWidget({ events, userId }: UpcomingEventsWidgetProps) {
  return (
    <Card>
      <CardHeader
        title="Upcoming Events"
        action={
          <Link
            href="/events"
            className="font-condensed font-semibold uppercase tracking-wide text-xs border rounded px-3 py-1.5 transition-colors"
            style={{ color: '#1b3c5a', borderColor: 'rgba(27,60,90,0.2)' }}
          >
            All →
          </Link>
        }
      />
      <CardBody className="!px-6 !py-0">
        {events.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-condensed text-xs tracking-widest text-[#7a8a96]">
              No upcoming events
            </p>
          </div>
        ) : (
          events.map((event, i) => (
            <div
              key={event.id}
              style={{ borderBottom: i < events.length - 1 ? '1px solid rgba(27,60,90,0.08)' : undefined }}
            >
              <EventItem event={event} userId={userId} />
            </div>
          ))
        )}
      </CardBody>
    </Card>
  )
}
