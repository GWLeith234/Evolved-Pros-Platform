'use client'

import { useEffect, useState } from 'react'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { CountdownTimer } from './CountdownTimer'

// MR2 redesign: full-bleed hero with countdown, badges, host info, price.
// Public type kept identical to the previous version so existing imports
// (events/page.tsx) don't have to change.
export interface HeroEvent {
  id: string
  title: string
  description: string | null
  format: 'live' | 'in-person' | 'podcast' | 'replay' | string
  pillar: number | null
  starts_at: string
  hero_image_url: string | null
  image_url: string | null
  required_tier: string | null
  is_featured?: boolean
  attending_count?: number | null
  host_name?: string | null
  host_role?: string | null
  host_avatar_url?: string | null
  price_cents?: number | null
  watermark?: string | null
}

interface CinematicHeroProps {
  event: HeroEvent | null
  initialIsRsvpd?: boolean
}

const FORMAT_BADGE_LABEL: Record<string, string> = {
  'live':      'Live Event',
  'in-person': 'In-Person',
  'podcast':   'Podcast Live',
  'replay':    'Replay',
}

function priceLabel(priceCents: number | null | undefined, requiredTier: string | null): string {
  if (typeof priceCents === 'number' && priceCents > 0) {
    const dollars = priceCents / 100
    return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`
  }
  if (!requiredTier) return 'Free'
  const tier = requiredTier.toLowerCase()
  if (tier === 'community') return 'Free'
  return 'Included'
}

function hostInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function CinematicHero({ event, initialIsRsvpd = false }: CinematicHeroProps) {
  const [rsvpd, setRsvpd] = useState(initialIsRsvpd)
  const [rsvpInFlight, setRsvpInFlight] = useState(false)
  const [whenLabel, setWhenLabel] = useState('')

  // Defer locale-dependent date string to client so SSR and hydration agree.
  useEffect(() => {
    if (!event) return
    const d = new Date(event.starts_at)
    const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    setWhenLabel(`${datePart} · ${timePart}`.toUpperCase())
  }, [event])

  if (!event) {
    return (
      <section
        style={{
          position: 'relative',
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          minHeight: 480,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <p
            style={{
              margin: 0,
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 32,
              letterSpacing: '0.08em',
              color: 'var(--text-primary)',
            }}
          >
            No upcoming events
          </p>
          <p
            style={{
              margin: '12px 0 0',
              fontFamily: '"Barlow", sans-serif',
              fontSize: 14,
              lineHeight: 1.5,
              color: 'var(--text-tertiary)',
            }}
          >
            Check back soon — new sessions drop weekly.
          </p>
        </div>
      </section>
    )
  }

  const pillarConf = event.pillar && event.pillar >= 1 && event.pillar <= 6
    ? PILLAR_CONFIG[event.pillar]
    : null
  const coverUrl = event.hero_image_url ?? event.image_url ?? null
  const formatLabel = FORMAT_BADGE_LABEL[event.format] ?? String(event.format).toUpperCase()
  const featuredSuffix = event.is_featured ? ' · Featured' : ''

  async function handleRsvpClick() {
    if (rsvpInFlight) return
    const wasRsvpd = rsvpd
    setRsvpd(!wasRsvpd)
    setRsvpInFlight(true)
    try {
      const res = await fetch(`/api/events/${event!.id}/rsvp`, {
        method: wasRsvpd ? 'DELETE' : 'POST',
      })
      if (!res.ok) throw new Error(`rsvp failed: ${res.status}`)
    } catch (err) {
      console.error('[CinematicHero] rsvp failed:', err)
      setRsvpd(wasRsvpd)
    } finally {
      setRsvpInFlight(false)
    }
  }

  return (
    <section
      aria-label="Featured event"
      style={{
        position: 'relative',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        minHeight: 560,
        overflow: 'hidden',
        background: coverUrl ? '#000' : 'linear-gradient(135deg, #0A0F18 0%, #111926 50%, #1a0a0a 100%)',
      }}
    >
      {/* Cover image */}
      {coverUrl && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Dark overlay (per brief: rgba 0,0,0,0.5) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* TOP-LEFT badges */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '7px 14px',
            background: '#C9302A',
            color: '#FFFFFF',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          {formatLabel}
        </span>
        {rsvpd && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              background: 'rgba(201,168,76,0.18)',
              border: '1px solid rgba(201,168,76,0.55)',
              color: '#C9A84C',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          >
            ✓ On your calendar
          </span>
        )}
      </div>

      {/* TOP-RIGHT countdown */}
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <CountdownTimer
          targetIso={event.starts_at}
          liveWindowBeforeMinutes={5}
          liveWindowAfterMinutes={event.format === 'live' ? 180 : 120}
        />
      </div>

      {/* BOTTOM watermark */}
      {event.watermark && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 18,
            right: 24,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.18)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {event.watermark}
        </span>
      )}

      {/* BOTTOM content */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '0 48px 56px',
          maxWidth: 980,
          color: '#FFFFFF',
        }}
      >
        {/* Pillar tag */}
        {pillarConf && (
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              background: `${pillarConf.color}2E`,
              border: `1px solid ${pillarConf.color}66`,
              color: pillarConf.color,
              marginBottom: 14,
            }}
          >
            {pillarConf.label}{featuredSuffix}
          </span>
        )}

        {/* Title */}
        <h2
          style={{
            margin: 0,
            fontFamily: '"Bebas Neue", sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(40px, 6vw, 72px)',
            lineHeight: 1.02,
            letterSpacing: '0.01em',
            textTransform: 'uppercase',
            textShadow: '0 2px 16px rgba(0,0,0,0.5)',
          }}
        >
          {event.title}
        </h2>

        {/* Description */}
        {event.description && (
          <p
            style={{
              margin: '14px 0 0',
              fontFamily: '"Barlow", sans-serif',
              fontSize: 16,
              lineHeight: 1.45,
              color: 'rgba(255,255,255,0.78)',
              maxWidth: 720,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {event.description}
          </p>
        )}

        {/* Host row */}
        {(event.host_name || event.host_role) && (
          <div
            style={{
              marginTop: 22,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {event.host_avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.host_avatar_url}
                alt=""
                aria-hidden="true"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <span
                aria-hidden="true"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #C9302A, #8B1F1B)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 14,
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                {hostInitials(event.host_name)}
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              {event.host_name && (
                <p
                  style={{
                    margin: 0,
                    fontFamily: '"Barlow", sans-serif',
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#FFFFFF',
                  }}
                >
                  {event.host_name}
                </p>
              )}
              {event.host_role && (
                <p
                  style={{
                    margin: 0,
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 600,
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.55)',
                  }}
                >
                  {event.host_role}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Details row: WHEN | PRICE */}
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'baseline',
            gap: 24,
            flexWrap: 'wrap',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.78)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>When</span>
            <span style={{ color: '#FFFFFF', fontWeight: 700 }} suppressHydrationWarning>
              {whenLabel || '—'}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>Price</span>
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>
              {priceLabel(event.price_cents, event.required_tier)}
            </span>
          </span>
          {typeof event.attending_count === 'number' && event.attending_count > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>Going</span>
              <span style={{ color: '#FFFFFF', fontWeight: 700 }}>
                {event.attending_count}
              </span>
            </span>
          )}
        </div>

        {/* RSVP CTA */}
        <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRsvpClick}
            disabled={rsvpInFlight}
            aria-pressed={rsvpd}
            aria-busy={rsvpInFlight}
            style={{
              padding: '14px 32px',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 15,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              background: rsvpd ? '#C9A84C' : '#C9302A',
              color: rsvpd ? '#0A0F18' : '#FFFFFF',
              border: 'none',
              borderRadius: 0,
              cursor: rsvpInFlight ? 'wait' : 'pointer',
              transition: 'background 160ms ease',
              minWidth: 180,
            }}
          >
            {rsvpd ? '✓ Going' : 'RSVP'}
          </button>
        </div>
      </div>
    </section>
  )
}
