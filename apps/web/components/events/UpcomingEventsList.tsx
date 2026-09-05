'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { eventTypeBadge } from '@/lib/events/types'
import { hasTierAccess } from '@/lib/tier'
import { buildUpgradeHref, tierBadgeLabel } from '@/lib/academy/gating'
import type { HeroEvent } from './CinematicHero'
import { withoutConquerLocal } from '@/lib/events/nextEvent'

interface UpcomingEventsListProps {
  events: HeroEvent[]
  /** Initial set of event ids the current user has RSVP'd to. */
  registeredIds: string[]
  /**
   * Viewer's effective tier, for LABELLING sessions above it (SPRINT TIER-1).
   * Access rules are unchanged — the RSVP endpoint is still the authority;
   * this only decides whether the row shows an RSVP button or a tier chip.
   */
  viewerTier: string | null
}

interface DateBadge {
  month: string
  day: string
  time: string
}

function formatDateBadge(iso: string): DateBadge {
  // SPRINT O Pattern B / Fix 2 Option A: pin every field to timeZone: 'UTC'
  // so server (UTC) and client (local TZ) produce identical strings. The
  // viewer-local time format was the last unguarded source of #425/#422 on
  // /events — even with a mount gate the function still ran in render scope
  // and returned a TZ-dependent object. Pinning UTC eliminates the diff and
  // lets the time render unconditionally; timeZoneName: 'short' surfaces the
  // "UTC" suffix so users know the zone (the CountdownTimer in the hero
  // remains the primary actionable display).
  const d = new Date(iso)
  return {
    month: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase(),
    day: d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' }),
  }
}

export function UpcomingEventsList({ events, registeredIds, viewerTier }: UpcomingEventsListProps) {
  const [registered, setRegistered] = useState<Set<string>>(() => new Set(registeredIds))
  const [inflightId, setInflightId] = useState<string | null>(null)

  const sorted = useMemo(
    () => withoutConquerLocal(events).sort((a, b) =>
      new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    ),
    [events],
  )

  async function toggleRsvp(eventId: string) {
    if (inflightId) return
    const wasRegistered = registered.has(eventId)
    // Optimistic
    setRegistered(prev => {
      const next = new Set(prev)
      if (wasRegistered) next.delete(eventId)
      else next.add(eventId)
      return next
    })
    setInflightId(eventId)
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: wasRegistered ? 'DELETE' : 'POST',
      })
      if (!res.ok) throw new Error(`rsvp failed: ${res.status}`)
    } catch (err) {
      console.error('[UpcomingEventsList] rsvp failed:', err)
      setRegistered(prev => {
        const next = new Set(prev)
        if (wasRegistered) next.add(eventId)
        else next.delete(eventId)
        return next
      })
    } finally {
      setInflightId(null)
    }
  }

  if (sorted.length === 0) {
    return (
      <div
        style={{
          margin: '40px auto',
          padding: '64px 24px',
          maxWidth: 1200,
          border: '1px dashed var(--border-color)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          No more upcoming events
        </p>
      </div>
    )
  }

  return (
    <section
      aria-label="Upcoming events"
      style={{
        maxWidth: 1200,
        margin: '40px auto 64px',
        padding: '0 24px',
      }}
    >
      <h3
        style={{
          margin: '0 0 16px',
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 22,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
        }}
      >
        Upcoming
      </h3>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
        {sorted.map(event => {
          const isRegistered = registered.has(event.id)
          const isInflight = inflightId === event.id
          const badge = formatDateBadge(event.starts_at)
          const fmt = eventTypeBadge(event.event_type)
          const pillarConf = event.pillar && event.pillar >= 1 && event.pillar <= 6
            ? PILLAR_CONFIG[event.pillar]
            : null
          // Tier comparison via hasTierAccess only. An event with no
          // required_tier is open to everyone, which is the common case.
          const tierChip = tierBadgeLabel(event.required_tier)
          const gated = tierChip !== null && !hasTierAccess(viewerTier, event.required_tier)

          return (
            <li
              key={event.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '72px 1fr auto',
                gap: 16,
                alignItems: 'center',
                padding: '14px 16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 4,
              }}
            >
              {/* Date badge */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '8px 6px',
                  background: 'rgba(27,42,74,0.06)',
                  border: '1px solid rgba(27,42,74,0.12)',
                  borderRadius: 4,
                  minWidth: 60,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: '0.22em',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {badge.month}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: 22,
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                  }}
                >
                  {badge.day}
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
                    letterSpacing: '0.14em',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                  }}
                >
                  {badge.time}
                </p>
              </div>

              {/* Body */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 700,
                      fontSize: 12,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      background: fmt.background,
                      color: fmt.color,
                      border: `1px solid ${fmt.border}`,
                    }}
                  >
                    {fmt.pulse && (
                      <span
                        aria-hidden="true"
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: 'currentColor',
                          animation: 'ch-pulse 1.4s ease-in-out infinite',
                        }}
                      />
                    )}
                    {fmt.label}
                  </span>
                  {pillarConf && (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        fontFamily: '"Barlow Condensed", sans-serif',
                        fontWeight: 700,
                        fontSize: 12,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        background: `${pillarConf.color}1A`,
                        color: pillarConf.color,
                        border: `1px solid ${pillarConf.color}55`,
                      }}
                    >
                      {pillarConf.label}
                    </span>
                  )}
                </div>
                <Link
                  href={`/events/${event.id}`}
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    margin: '6px 0 4px',
                    fontFamily: '"Barlow", sans-serif',
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    overflow: 'hidden',
                  }}
                >
                  {event.title}
                </Link>
                {typeof event.attending_count === 'number' && event.attending_count > 0 && (
                  <p
                    style={{
                      margin: 0,
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 600,
                      fontSize: 12,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {event.attending_count} going
                  </p>
                )}
              </div>

              {/* CTA — a tier chip replaces the RSVP action for sessions
                  above the viewer's tier (SPRINT TIER-1). Labelling only: the
                  RSVP endpoint still enforces access on its own. */}
              {gated ? (
                <Link
                  href={buildUpgradeHref({ from: 'events', tier: event.required_tier })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 18px',
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    textDecoration: 'none',
                    minWidth: 90,
                    minHeight: 44,
                  }}
                >
                  {tierChip}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleRsvp(event.id)}
                  disabled={isInflight}
                  aria-pressed={isRegistered}
                  aria-busy={isInflight}
                  style={{
                    padding: '10px 18px',
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    background: isRegistered ? 'var(--brand-gold)' : 'var(--brand-red)',
                    color: isRegistered ? 'var(--navy-abyss)' : 'var(--white)',
                    border: 'none',
                    cursor: isInflight ? 'wait' : 'pointer',
                    transition: 'background 140ms ease',
                    minWidth: 90,
                    minHeight: 44,
                  }}
                >
                  {isRegistered ? '✓ Going' : 'RSVP'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
