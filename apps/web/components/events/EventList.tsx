'use client'

import { useState } from 'react'
import { EventCard } from './EventCard'
import type { EventItem, EventType } from '@/lib/events/types'

interface EventListProps {
  events: EventItem[]
  registeredEventIds: string[]
  userTier: string | null
  view?: 'upcoming' | 'registrations' | 'recordings'
  typeFilter?: EventType | null
}

export function EventList({ events, registeredEventIds, userTier, view = 'upcoming', typeFilter }: EventListProps) {
  const [registeredIds, setRegisteredIds] = useState(new Set(registeredEventIds))

  const now = new Date()

  const filtered = events.filter(e => {
    const isPast = new Date(e.startsAt) < now
    if (view === 'upcoming' && isPast) return false
    if (view === 'registrations' && !registeredIds.has(e.id)) return false
    if (view === 'recordings' && !e.recordingUrl) return false
    if (typeFilter && e.eventType !== typeFilter) return false
    return true
  })

  async function handleRegister(eventId: string) {
    const res = await fetch(`/api/events/${eventId}/register`, { method: 'POST' })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Registration failed')
    }
    setRegisteredIds(prev => new Set([...prev, eventId]))
  }

  async function handleUnregister(eventId: string) {
    const res = await fetch(`/api/events/${eventId}/register`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Unregister failed')
    }
    setRegisteredIds(prev => {
      const next = new Set(prev)
      next.delete(eventId)
      return next
    })
  }

  const sectionLabel = view === 'registrations'
    ? 'My Registrations'
    : view === 'recordings'
    ? 'Recordings'
    : 'Upcoming Events'

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.12)' }}
    >
      <div
        className="px-6 py-3"
        style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}
      >
        <h2 className="font-condensed font-bold uppercase tracking-wide text-[13px] text-[#1b3c5a]">
          {sectionLabel}
        </h2>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-condensed text-xs tracking-widest text-[#7a8a96]">
            {view === 'registrations'
              ? 'No registered events yet.'
              : view === 'recordings'
              ? 'No recordings available yet.'
              : 'No upcoming events. Check back soon.'}
          </p>
        </div>
      ) : (
        <div className="px-6">
          {filtered.map((event, i) => (
            <EventCard
              key={event.id}
              event={event}
              isRegistered={registeredIds.has(event.id)}
              hasAccess={event.hasAccess}
              isLast={i === filtered.length - 1}
              onRegister={handleRegister}
              onUnregister={handleUnregister}
            />
          ))}
        </div>
      )}
    </div>
  )
}
