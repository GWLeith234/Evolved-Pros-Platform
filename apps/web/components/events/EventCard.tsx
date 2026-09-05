'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { formatEventDate, formatDuration, EVENT_TYPE_LABELS } from '@/lib/events/types'
import type { EventItem } from '@/lib/events/types'
import { buildUpgradeHref, tierBadgeLabel, tierPlanName } from '@/lib/academy/gating'
import { eventCardImageAlt, eventCardImageUrl } from '@/lib/events/cityStock'

const TYPE_GRADIENTS: Record<string, string> = {
  live:     'linear-gradient(135deg, #1a0a0a, #3d1515, #1B2A4A)',
  virtual:  'linear-gradient(135deg, #0A0F18, #0D2435, #0ABFA3)',
  inperson: 'linear-gradient(135deg, #0A0F18, #1B2A4A)',
}

const TYPE_BADGE_BG: Record<string, string> = {
  live:     '#ef0e30',
  virtual:  '#0ABFA3',
  inperson: '#1b3c5a',
}

interface EventCardProps {
  event: EventItem
  isRegistered: boolean
  hasAccess: boolean
  isLast?: boolean
  onRegister: (eventId: string) => Promise<void>
  onUnregister: (eventId: string) => Promise<void>
}

export function EventCard({ event, isRegistered: initialRegistered, hasAccess, onRegister, onUnregister }: EventCardProps) {
  const [registered, setRegistered] = useState(initialRegistered)
  const [loading, setLoading] = useState(false)
  const [isPast, setIsPast] = useState(false)
  useEffect(() => { setIsPast(new Date(event.startsAt) < new Date()) }, [event.startsAt])

  const { day, month, time } = formatEventDate(event.startsAt)
  const duration = formatDuration(event.startsAt, event.endsAt)
  const typeLabel = EVENT_TYPE_LABELS[event.eventType]
  const badgeBg = TYPE_BADGE_BG[event.eventType] ?? TYPE_BADGE_BG.inperson
  const gradient = TYPE_GRADIENTS[event.eventType] ?? TYPE_GRADIENTS.inperson
  const tierChip = tierBadgeLabel(event.requiredTier)

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

  let cta: React.ReactNode
  if (isPast && event.recordingUrl) {
    cta = (
      <a
        href={event.recordingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center text-center font-condensed font-bold uppercase tracking-wide text-[12px] rounded py-2.5 min-h-[44px] transition-colors"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        Watch Recording
      </a>
    )
  } else if (!hasAccess) {
    // SPRINT TIER-1 — labelling only; event access rules are unchanged. The
    // chip names the tier the SESSION actually requires (this used to say
    // "Pro Required" on every gated event, including VIP ones) and links to
    // the pricing ladder instead of pointing at Settings.
    cta = (
      <Link
        href={buildUpgradeHref({ from: 'events', tier: event.requiredTier })}
        className="flex w-full items-center justify-center gap-2 text-center font-condensed font-bold uppercase tracking-wide text-[12px] rounded py-2.5 min-h-[44px]"
        style={{
          // This whole card is a FIXED-DARK surface (see the container bg
          // below), so the CTA uses the same white-alpha values as its sibling
          // "Watch Recording" action rather than semantic tokens, which would
          // flip to parchment on a card that stays dark in light mode.
          backgroundColor: 'rgba(255,255,255,0.06)',
          color: 'var(--white)',
          border: '1px solid rgba(255,255,255,0.15)',
          textDecoration: 'none',
        }}
      >
        {tierChip && (
          <span
            className="font-condensed font-black uppercase tracking-[0.16em] text-[10px] px-1.5 py-0.5"
            style={{ color: 'var(--brand-gold-bright)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            {tierChip}
          </span>
        )}
        Unlock with {tierPlanName(event.requiredTier)}
      </Link>
    )
  } else if (registered) {
    cta = (
      <button
        onClick={handleAction}
        disabled={loading}
        className="flex w-full items-center justify-center text-center font-condensed font-bold uppercase tracking-wide text-[12px] rounded py-2.5 min-h-[44px] transition-colors"
        style={{ backgroundColor: '#0ABFA3', color: 'white' }}
      >
        {loading ? '...' : '✓ Registered'}
      </button>
    )
  } else {
    cta = (
      <button
        onClick={handleAction}
        disabled={loading}
        className="flex w-full items-center justify-center text-center font-condensed font-bold uppercase tracking-wide text-[12px] rounded py-2.5 min-h-[44px] transition-colors"
        style={{ backgroundColor: '#ef0e30', color: 'white' }}
      >
        {loading ? '...' : 'Register →'}
      </button>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ backgroundColor: '#112535', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Banner */}
      <Link href={`/events/${event.id}`} tabIndex={-1}>
        <div className="relative w-full overflow-hidden" style={{ height: '160px', background: gradient }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={eventCardImageUrl(event.imageUrl)}
            alt={eventCardImageAlt(event.city)}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Darkening overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)' }}
          />
          {/* Date pill — bottom-left */}
          <div
            className="absolute bottom-3 left-3 flex flex-col items-center"
            style={{
              backgroundColor: 'rgba(0,0,0,0.52)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              borderRadius: '8px',
              padding: '5px 10px',
              minWidth: '40px',
              textAlign: 'center',
            }}
          >
            <span
              className="font-display font-black text-white leading-none"
              style={{ fontSize: '26px' }}
            >
              {day}
            </span>
            <span
              className="font-condensed font-bold uppercase leading-none"
              style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}
            >
              {month}
            </span>
          </div>
          {/* Type badge — top-right */}
          <div className="absolute top-3 right-3">
            <span
              className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-2 py-1 text-white"
              style={{ backgroundColor: badgeBg }}
            >
              {typeLabel}
            </span>
          </div>
        </div>
      </Link>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <Link href={`/events/${event.id}`} className="group">
          <h3
            className="font-body font-semibold leading-snug line-clamp-2 group-hover:text-[#68a2b9] transition-colors"
            style={{ fontSize: '15px', color: '#faf9f7' }}
          >
            {event.title}
          </h3>
        </Link>
        <p className="font-condensed text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {time}{duration ? ` · ${duration}` : ''}
          {event.registrationCount > 0 && ` · ${event.registrationCount} registered`}
        </p>
        <div className="mt-auto pt-2">
          {cta}
        </div>
      </div>
    </div>
  )
}
