'use client'

import { useState } from 'react'
import {
  formatEventDate, formatDuration, generateICS,
  EVENT_TYPE_LABELS, EVENT_TYPE_STYLES,
} from '@/lib/events/types'
import type { EventItem } from '@/lib/events/types'

interface EventDetailHeroProps {
  event: EventItem
}

export function EventDetailHero({ event }: EventDetailHeroProps) {
  const [registered, setRegistered] = useState(event.isRegistered)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { day, month, time, full } = formatEventDate(event.startsAt)
  const duration = formatDuration(event.startsAt, event.endsAt)
  const isPast = new Date(event.startsAt) < new Date()
  const typeStyle = EVENT_TYPE_STYLES[event.eventType]
  const typeLabel = EVENT_TYPE_LABELS[event.eventType]

  async function handleAction() {
    if (!event.hasAccess || loading || isPast) return
    setLoading(true)
    setError(null)
    try {
      const method = registered ? 'DELETE' : 'POST'
      const res = await fetch(`/api/events/${event.id}/register`, { method })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? (registered ? 'Unregister failed' : 'Registration failed'))
      }
      setRegistered(prev => !prev)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function downloadICS() {
    const ics = generateICS({ ...event, isRegistered: registered })
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.title.replace(/\s+/g, '-').toLowerCase()}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(27,60,90,0.12)' }}>
      {/* Header */}
      <div
        className="px-8 py-8"
        style={{ backgroundColor: '#112535' }}
      >
        <div className="flex items-start gap-6">
          {/* Date block */}
          <div className="flex-shrink-0 w-16 text-center">
            <p
              className="font-display font-black leading-none"
              style={{ fontSize: '48px', color: '#faf9f7' }}
            >
              {day}
            </p>
            <p className="font-condensed font-bold uppercase text-[11px]" style={{ color: '#ef0e30' }}>
              {month}
            </p>
          </div>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className="font-condensed font-bold uppercase text-[9px] rounded px-2 py-0.5"
                style={{ color: typeStyle.color, backgroundColor: typeStyle.bg, border: `1px solid ${typeStyle.border}` }}
              >
                {typeLabel}
              </span>
              {event.requiredTier === 'pro' && (
                <span
                  className="font-condensed font-bold uppercase text-[9px] rounded px-2 py-0.5"
                  style={{ color: '#c9a84c', backgroundColor: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}
                >
                  Pro
                </span>
              )}
            </div>
            <h1
              className="font-display font-black leading-tight mb-2"
              style={{ fontSize: '28px', color: '#faf9f7' }}
            >
              {event.title}
            </h1>
            <p className="font-condensed font-medium text-[12px]" style={{ color: 'rgba(250,249,247,0.5)' }}>
              {full} · {time} · {duration}
              {event.registrationCount > 0 && ` · ${event.registrationCount} registered`}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-8 py-6" style={{ backgroundColor: 'white' }}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
          {/* Left: description + details */}
          <div>
            {event.description && (
              <p className="font-body text-[14px] leading-relaxed text-[#1b3c5a] mb-6 whitespace-pre-line">
                {event.description}
              </p>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-0.5">Date</p>
                <p className="font-body font-semibold text-[13px] text-[#1b3c5a]">{full}</p>
              </div>
              <div>
                <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-0.5">Time</p>
                <p className="font-body font-semibold text-[13px] text-[#1b3c5a]">{time}{event.endsAt ? ` – ${formatEventDate(event.endsAt).time}` : ''}</p>
              </div>
              <div>
                <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-0.5">Duration</p>
                <p className="font-body font-semibold text-[13px] text-[#1b3c5a]">{duration}</p>
              </div>
              <div>
                <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-0.5">Format</p>
                <p className="font-body font-semibold text-[13px] text-[#1b3c5a]">{typeLabel}</p>
              </div>

              {/* Zoom link — only when registered */}
              {registered && event.zoomUrl && !isPast && (
                <div className="col-span-2">
                  <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-0.5">Join Link</p>
                  <a
                    href={event.zoomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body font-semibold text-[13px] text-[#68a2b9] hover:underline break-all"
                  >
                    {event.zoomUrl}
                  </a>
                </div>
              )}

              {/* Recording link */}
              {isPast && event.recordingUrl && (
                <div className="col-span-2">
                  <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-0.5">Recording</p>
                  <a
                    href={event.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-condensed font-semibold text-[12px] uppercase tracking-wide text-[#68a2b9] hover:underline"
                  >
                    Watch Recording →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right: CTA panel */}
          <div
            className="rounded-lg p-5 flex flex-col gap-3 min-w-[200px]"
            style={{ backgroundColor: '#faf9f7', border: '1px solid rgba(27,60,90,0.1)' }}
          >
            {error && (
              <p className="font-condensed text-[11px] text-[#ef0e30]">{error}</p>
            )}

            {isPast ? (
              event.recordingUrl ? (
                <a
                  href={event.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-4 py-3 text-center transition-all"
                  style={{ backgroundColor: '#1b3c5a', color: 'white' }}
                >
                  Watch Recording →
                </a>
              ) : (
                <p className="font-condensed text-[11px] text-center text-[#7a8a96]">
                  Recording not available yet.
                </p>
              )
            ) : !event.hasAccess ? (
              <>
                <p className="font-condensed font-bold uppercase tracking-[0.15em] text-[9px] text-center text-[#7a8a96]">
                  Pro Membership Required
                </p>
                <a
                  href="/membership"
                  className="w-full font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-4 py-3 text-center transition-all"
                  style={{ backgroundColor: '#ef0e30', color: 'white' }}
                >
                  Upgrade to Pro →
                </a>
              </>
            ) : (
              <button
                onClick={handleAction}
                disabled={loading}
                className="w-full font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-4 py-3 text-center transition-all"
                style={{
                  backgroundColor: registered ? '#68a2b9' : '#1b3c5a',
                  color: 'white',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? '...' : registered ? 'Registered ✓' : 'Register for Event →'}
              </button>
            )}

            {/* Add to Calendar */}
            {!isPast && (
              <button
                onClick={downloadICS}
                className="w-full font-condensed font-semibold uppercase tracking-wide text-[11px] rounded px-4 py-2.5 transition-all text-center"
                style={{ color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'transparent' }}
              >
                Add to Calendar
              </button>
            )}

            {/* Registration count */}
            {event.registrationCount > 0 && (
              <p className="font-condensed text-[10px] text-center text-[#7a8a96]">
                {event.registrationCount} {event.registrationCount === 1 ? 'person' : 'people'} registered
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
