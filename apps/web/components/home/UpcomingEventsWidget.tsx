'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardBody } from '@evolved-pros/ui'
import { Button } from '@/components/ui/Button'

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

function EventItem({ event }: { event: EventRow }) {
  const [registered, setRegistered] = useState(event.isRegistered)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Defer toLocaleTimeString to client-only — timeZoneName: 'short' produces different output
  // on server (UTC → "12:00 PM UTC") vs browser (local tz → "8:00 AM EDT") — hydration error #425
  const [durationStr, setDurationStr] = useState('')
  useEffect(() => { setDurationStr(formatDuration(event.starts_at, event.ends_at)) }, [event.starts_at, event.ends_at])

  // UTC accessors so SSR (UTC) and browser (local TZ) agree on the day/month
  // label. starts_at is stored as an ISO UTC string, and getDate()/getMonth()
  // would otherwise drift across the SSR→CSR boundary near midnight UTC and
  // trip React #425.
  const date = new Date(event.starts_at)
  const day = date.getUTCDate()
  const month = MONTH_ABBR[date.getUTCMonth()]
  const platform = event.event_type === 'virtual' ? 'Zoom' : event.event_type === 'live' ? 'Live' : 'In-Person'

  async function handleRegister() {
    if (registered) return
    setLoading(true)
    setError(null)
    // Same registration flow the /events page uses. The previous direct
    // browser-client insert into event_registrations was silently rejected
    // by RLS (auth.uid() ≠ public.users.id) — a dead button. The API route
    // resolves the public id by email and handles tier gating, counts,
    // points, the reminder notification, and the confirmation email.
    try {
      const res = await fetch(`/api/events/${event.id}/register`, { method: 'POST' })
      if (res.ok) {
        setRegistered(true)
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? 'Registration failed')
      }
    } catch {
      setError('Network error — try again')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-start gap-4 py-4">
      {/* Date block + event info — real link to the event detail page. */}
      <Link
        href={`/events/${event.id}`}
        className="flex items-start gap-4 flex-1 min-w-0"
        style={{ textDecoration: 'none' }}
      >
        <div className="flex-shrink-0 flex flex-col items-center w-10">
          <span
            className="leading-none text-[26px]"
            style={{
              fontFamily: '"Bebas Neue", sans-serif',
              letterSpacing: '0.02em',
              color: 'var(--text-primary)',
            }}
          >
            {day}
          </span>
          <span
            className="font-condensed font-bold uppercase text-[12px] tracking-wide"
            style={{ color: 'var(--brand-red, #C9302A)' }}
          >
            {month}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="font-body font-semibold text-[13px] leading-tight mb-0.5"
            style={{ color: 'var(--text-primary)' }}
          >
            {event.title}
          </p>
          <p
            className="font-condensed text-[12px] font-medium"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {durationStr} · {platform}
          </p>
          {error && (
            <p className="font-condensed text-[11px] font-medium" style={{ color: '#ef0e30' }}>
              {error}
            </p>
          )}
        </div>
      </Link>

      {/* Action — Sprint 1 Button variants */}
      <Button
        variant={registered ? 'success' : 'secondary'}
        size="sm"
        loading={loading}
        disabled={registered}
        onClick={handleRegister}
        className="flex-shrink-0"
      >
        {registered ? 'Registered' : 'Register'}
      </Button>
    </div>
  )
}

export function UpcomingEventsWidget({ events }: UpcomingEventsWidgetProps) {
  return (
    <Card>
      <CardHeader
        title="Upcoming Events"
        action={
          <Button variant="tertiary" size="sm" href="/events">
            All
          </Button>
        }
      />
      <CardBody className="!px-6 !py-0">
        {events.length === 0 ? (
          <div className="py-8 text-center">
            <p
              className="font-condensed text-xs tracking-widest"
              style={{ color: 'var(--text-tertiary)' }}
            >
              No upcoming events
            </p>
          </div>
        ) : (
          events.map((event, i) => (
            <div
              key={event.id}
              style={{
                borderBottom:
                  i < events.length - 1 ? '1px solid var(--border-color)' : undefined,
              }}
            >
              <EventItem event={event} />
            </div>
          ))
        )}
      </CardBody>
    </Card>
  )
}
