'use client'

import Link from 'next/link'
import { useState } from 'react'
import { formatEventDate, formatDuration, EVENT_TYPE_LABELS, EVENT_TYPE_STYLES } from '@/lib/events/types'
import type { EventItem } from '@/lib/events/types'

interface EventCardProps {
  event: EventItem
  isRegistered: boolean
  hasAccess: boolean
  isLast?: boolean
  onRegister: (eventId: string) => Promise<void>
  onUnregister: (eventId: string) => Promise<void>
}

export function EventCard({ event, isRegistered: initialRegistered, hasAccess, isLast = false, onRegister, onUnregister }: EventCardProps) {
  const [registered, setRegistered] = useState(initialRegistered)
  const [loading, setLoading] = useState(false)

  const { day, month, time } = formatEventDate(event.startsAt)
  const duration = formatDuration(event.startsAt, event.endsAt)
  const isPast = new Date(event.startsAt) < new Date()
  const typeStyle = EVENT_TYPE_STYLES[event.eventType]
  const typeLabel = EVENT_TYPE_LABELS[event.eventType]

  async function handleAction() {
    if (!hasAccess || loading) return
    setLoading(true)
    try {
      if (registered) {
        await onUnregister(event.id)
        setRegistered(false)
      } else {
        await onRegister(event.id)
        setRegistered(true)
      }
    } finally {
      setLoading(false)
    }
  }

  function ActionButton() {
    if (isPast && event.recordingUrl) {
      return (
        <a
          href={event.recordingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-condensed font-semibold uppercase tracking-wide text-xs rounded px-4 py-2 transition-all flex-shrink-0"
          style={{ color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.3)', backgroundColor: 'transparent' }}
        >
          Watch Recording
        </a>
      )
    }

    if (!hasAccess) {
      return (
        <span
          className="font-condensed font-semibold uppercase tracking-wide text-xs rounded px-4 py-2 flex-shrink-0"
          style={{ color: '#7a8a96', border: '1px solid rgba(27,60,90,0.15)', backgroundColor: 'transparent' }}
        >
          Pro Required
        </span>
      )
    }

    if (registered) {
      return (
        <button
          onClick={handleAction}
          disabled={loading}
          className="font-condensed font-semibold uppercase tracking-wide text-xs rounded px-4 py-2 text-white transition-all flex-shrink-0"
          style={{ backgroundColor: '#68a2b9', border: '1px solid #68a2b9' }}
        >
          {loading ? '...' : 'Registered ✓'}
        </button>
      )
    }

    return (
      <button
        onClick={handleAction}
        disabled={loading}
        className="font-condensed font-semibold uppercase tracking-wide text-xs rounded px-4 py-2 transition-all flex-shrink-0"
        style={{ color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.3)', backgroundColor: 'transparent' }}
      >
        {loading ? '...' : 'Register →'}
      </button>
    )
  }

  return (
    <div
      className="flex items-center gap-4 py-4"
      style={{ borderBottom: isLast ? 'none' : '1px solid rgba(27,60,90,0.08)' }}
    >
      {/* Date block */}
      <div className="flex-shrink-0 w-14 text-center">
        <p
          className="font-display font-black leading-none"
          style={{ fontSize: '26px', color: isPast ? '#7a8a96' : '#112535' }}
        >
          {day}
        </p>
        <p className="font-condensed font-bold uppercase text-[10px]" style={{ color: '#ef0e30' }}>
          {month}
        </p>
      </div>

      {/* Event info */}
      <div className="flex-1 min-w-0">
        <Link href={`/events/${event.id}`} className="group">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-body font-semibold text-[14px] text-[#1b3c5a] group-hover:text-[#68a2b9] transition-colors truncate">
              {event.title}
            </span>
            <span
              className="font-condensed font-bold uppercase text-[9px] rounded px-2 py-0.5 flex-shrink-0"
              style={{ color: typeStyle.color, backgroundColor: typeStyle.bg, border: `1px solid ${typeStyle.border}` }}
            >
              {typeLabel}
            </span>
          </div>
        </Link>
        <p className="font-condensed font-medium text-[11px] text-[#7a8a96]">
          {time} · {duration} · {typeLabel}
          {event.registrationCount > 0 && ` · ${event.registrationCount} registered`}
        </p>
      </div>

      {/* Action */}
      <ActionButton />
    </div>
  )
}
