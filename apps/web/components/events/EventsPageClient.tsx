'use client'

import { Button } from '@/components/ui/Button'
import { useState } from 'react'
import Link from 'next/link'
import type { EventItem } from '@/lib/events/types'
import { formatEventDate, EVENT_TYPE_LABELS, EVENT_TYPE_STYLES } from '@/lib/events/types'

type Filter = 'all' | 'upcoming' | 'live' | 'virtual' | 'inperson' | 'registered'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'upcoming',   label: 'Upcoming' },
  { key: 'live',       label: 'Live Sessions' },
  { key: 'virtual',    label: 'Virtual' },
  { key: 'inperson',   label: 'In-Person' },
  { key: 'registered', label: 'My Registrations' },
]

function TierBadge({ requiredTier }: { requiredTier: 'community' | 'pro' | null }) {
  if (requiredTier === 'pro') {
    return (
      <span
        className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] rounded px-2 py-0.5"
        style={{ backgroundColor: 'rgba(239,14,48,0.1)', color: '#ef0e30', border: '1px solid rgba(239,14,48,0.2)' }}
      >
        Pro Only
      </span>
    )
  }
  if (requiredTier === 'community') {
    return (
      <span
        className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] rounded px-2 py-0.5"
        style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}
      >
        VIP Only
      </span>
    )
  }
  return (
    <span
      className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] rounded px-2 py-0.5"
      style={{ backgroundColor: 'rgba(122,138,150,0.1)', color: '#7a8a96', border: '1px solid rgba(122,138,150,0.2)' }}
    >
      All Members
    </span>
  )
}

interface CardProps {
  event: EventItem
  isRegistered: boolean
  onRegister: (id: string) => void
  onUnregister: (id: string) => void
}

function EventGridCard({ event, isRegistered, onRegister, onUnregister }: CardProps) {
  const { day, month, time } = formatEventDate(event.startsAt)
  const typeStyle = EVENT_TYPE_STYLES[event.eventType]
  const typeLabel = EVENT_TYPE_LABELS[event.eventType]
  const isPast = new Date(event.startsAt) < new Date()
  const [loading, setLoading] = useState(false)

  const TYPE_GRADIENT: Record<string, string> = {
    live:     'linear-gradient(135deg, #2a0a10 0%, #1a0508 100%)',
    virtual:  'linear-gradient(135deg, #0a1a20 0%, #051015 100%)',
    inperson: 'linear-gradient(135deg, #0a1525 0%, #05101a 100%)',
  }

  async function handleAction(e: React.MouseEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      if (isRegistered) await onUnregister(event.id)
      else await onRegister(event.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Link
      href={`/events/${event.id}`}
      className="block rounded-xl overflow-hidden transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5"
      style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
    >
      {/* 16:9 image area */}
      <div className="relative w-full aspect-video overflow-hidden">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: TYPE_GRADIENT[event.eventType] }}
          />
        )}

        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />

        {/* Type pill — top right */}
        <div className="absolute top-3 right-3">
          <span
            className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] rounded-full px-2.5 py-1"
            style={{ backgroundColor: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}`, backdropFilter: 'blur(4px)' }}
          >
            {typeLabel}
          </span>
        </div>

        {/* Date badge — bottom left */}
        <div
          className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        >
          <span className="font-display font-black text-white text-[18px] leading-none">{day}</span>
          <div className="flex flex-col">
            <span className="font-condensed font-bold uppercase text-[9px] leading-none" style={{ color: 'rgba(255,255,255,0.7)' }}>{month}</span>
            <span className="font-condensed text-[9px] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{time}</span>
          </div>
        </div>

        {/* Locked overlay */}
        {!event.hasAccess && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(10,15,24,0.75)', backdropFilter: 'blur(2px)' }}
          >
            <div className="text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" className="mx-auto mb-1">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span className="font-condensed font-bold text-[10px] uppercase tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Upgrade Required
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="px-4 py-3">
        <h3
          className="font-display font-bold text-[14px] leading-snug mb-2 line-clamp-2"
          style={{ color: '#112535' }}
        >
          {event.title}
        </h3>

        <div className="flex items-center justify-between">
          <TierBadge requiredTier={event.requiredTier} />

          {event.hasAccess && !isPast && (
            <Button
              variant={isRegistered ? 'ghost' : 'primary'}
              size="sm"
              onClick={handleAction}
              loading={loading}
            >
              {isRegistered ? '✓ Registered' : 'Register'}
            </Button>
          )}

          {isPast && event.recordingUrl && (
            <a
              href={event.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="font-condensed font-bold uppercase tracking-[0.1em] text-[10px] rounded-full px-3 py-1 transition-all"
              style={{ backgroundColor: 'rgba(104,162,185,0.1)', color: '#68a2b9', border: '1px solid rgba(104,162,185,0.2)' }}
            >
              Watch ▶
            </a>
          )}
        </div>
      </div>
    </Link>
  )
}

interface EventsPageClientProps {
  events: EventItem[]
  registeredEventIds: string[]
  userTier: string | null
}

export function EventsPageClient({ events, registeredEventIds }: EventsPageClientProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [registeredSet, setRegisteredSet] = useState(() => new Set(registeredEventIds))

  const now = new Date()

  const filtered = events.filter(ev => {
    if (filter === 'upcoming')   return new Date(ev.startsAt) >= now
    if (filter === 'live')       return ev.eventType === 'live'
    if (filter === 'virtual')    return ev.eventType === 'virtual'
    if (filter === 'inperson')   return ev.eventType === 'inperson'
    if (filter === 'registered') return registeredSet.has(ev.id)
    return true
  })

  async function register(eventId: string) {
    const res = await fetch(`/api/events/${eventId}/register`, { method: 'POST' })
    if (res.ok) setRegisteredSet(prev => new Set([...prev, eventId]))
  }

  async function unregister(eventId: string) {
    const res = await fetch(`/api/events/${eventId}/register`, { method: 'DELETE' })
    if (res.ok) setRegisteredSet(prev => { const s = new Set(prev); s.delete(eventId); return s })
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Parchment header */}
      <div
        className="px-6 py-6"
        style={{ backgroundColor: '#F5F0E8', borderBottom: '1px solid rgba(27,42,74,0.1)' }}
      >
        <p
          className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] mb-1"
          style={{ color: '#C9302A' }}
        >
          EVOLVED PROS
        </p>
        <h1
          className="font-display font-black leading-tight text-[28px] mb-1"
          style={{ color: '#1B2A4A' }}
        >
          Events
        </h1>
        <p
          className="font-body text-[14px] mb-4"
          style={{ color: '#6B7A8D', maxWidth: '540px' }}
        >
          Live sessions, workshops, and community gatherings for sales professionals.
        </p>

        {/* Filter pill bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className="font-condensed font-semibold uppercase tracking-[0.1em] text-[11px] rounded-full transition-all"
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                backgroundColor: filter === f.key ? '#1B2A4A' : '#ffffff',
                color: filter === f.key ? '#ffffff' : '#1B2A4A',
                border: `1px solid ${filter === f.key ? '#1B2A4A' : 'rgba(27,42,74,0.15)'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event grid */}
      <div className="px-6 py-6 max-w-6xl mx-auto w-full">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(ev => (
              <EventGridCard
                key={ev.id}
                event={ev}
                isRegistered={registeredSet.has(ev.id)}
                onRegister={register}
                onUnregister={unregister}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 font-condensed text-[13px]" style={{ color: '#7a8a96' }}>
            No events in this category yet.
          </div>
        )}
      </div>
    </div>
  )
}
