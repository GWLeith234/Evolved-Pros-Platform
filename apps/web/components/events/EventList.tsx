'use client'

import React, { useState, useEffect } from 'react'
import { EventCard } from './EventCard'
import { SponsorCard } from '@/components/ads/SponsorCard'
import { useSponsorAd } from '@/hooks/useSponsorAd'
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
  const eventsAd = useSponsorAd('events')

  // Defer now to useEffect — avoids server/client new Date() mismatch (hydration error #425)
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()) }, [])

  const filtered = events.filter(e => {
    const isPast = now !== null && new Date(e.startsAt) < now
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
    <div>
      <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] mb-4" style={{ color: '#7a8a96' }}>
        {sectionLabel}
      </p>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-condensed text-xs tracking-widest text-[#7a8a96]">
            {view === 'registrations'
              ? 'No registered events yet.'
              : view === 'recordings'
              ? 'No recordings available yet.'
              : 'No upcoming events. Check back soon.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((event, i) => (
            <React.Fragment key={event.id}>
              <EventCard
                event={event}
                isRegistered={registeredIds.has(event.id)}
                hasAccess={event.hasAccess}
                onRegister={handleRegister}
                onUnregister={handleUnregister}
              />
              {i === 0 && eventsAd && (
                <div
                  className="rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: '#112535', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}
                >
                  <SponsorCard ad={eventsAd} variant="events" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
