'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { eventTypeBadge } from '@/lib/events/types'
import { CountdownTimer } from './CountdownTimer'

// MR2 redesign: full-bleed hero with countdown, badges, host info, price.
// Public type kept identical to the previous version so existing imports
// (events/page.tsx) don't have to change.
export interface HeroEvent {
  id: string
  title: string
  description: string | null
  format: 'live' | 'in-person' | 'podcast' | 'replay' | string
  event_type: string | null
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
  tagline?: string | null
  cta_text?: string | null
}

interface CinematicHeroProps {
  event: HeroEvent | null
  initialIsRsvpd?: boolean
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
  const [mounted, setMounted] = useState(false)
  const [whenLabel, setWhenLabel] = useState('')

  // Mount gate + locale-dependent date string deferred to the client so SSR
  // and hydration agree (toLocale* + viewer-local TZ are non-deterministic
  // across the SSR/CSR boundary and surface as React #425/#422).
  useEffect(() => {
    setMounted(true)
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
  const typeBadge = eventTypeBadge(event.event_type)
  const featuredSuffix = event.is_featured ? ' · Featured' : ''
  const detailHref = `/events/${event.id}`

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
      className="cinematic-hero"
      style={{
        position: 'relative',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        minHeight: 560,
        overflow: 'hidden',
        background: coverUrl ? '#000' : 'linear-gradient(135deg, #0A0F18 0%, #111926 50%, #1a0a0a 100%)',
      }}
    >
      <style>{`
        @keyframes ch-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50%      { opacity: 1;   transform: scale(1.15); }
        }
        @media (max-width: 640px) {
          .cinematic-hero { min-height: 520px; }
          .cinematic-hero .ch-badges { top: 12px !important; left: 12px !important; gap: 6px !important; }
          .cinematic-hero .ch-badges > * { padding: 5px 10px !important; font-size: 12px !important; letter-spacing: 0.18em !important; }
          .cinematic-hero .ch-countdown { top: auto !important; right: 12px !important; bottom: auto !important; left: 12px !important; position: static !important; margin: 56px 12px 0 !important; }
          .cinematic-hero .ch-content { padding: 12px 20px 28px !important; max-width: 100% !important; }
          .cinematic-hero .ch-title { font-size: clamp(28px, 8vw, 40px) !important; }
          .cinematic-hero .ch-tagline { font-size: 12px !important; letter-spacing: 0.14em !important; }
          .cinematic-hero .ch-description { font-size: 14px !important; -webkit-line-clamp: 2 !important; }
          .cinematic-hero .ch-host { gap: 8px !important; margin-top: 14px !important; }
          .cinematic-hero .ch-host-avatar { width: 24px !important; height: 24px !important; font-size: 12px !important; }
          .cinematic-hero .ch-host-name { font-size: 13px !important; }
          .cinematic-hero .ch-host-role { font-size: 12px !important; }
          .cinematic-hero .ch-details { gap: 14px !important; font-size: 12px !important; margin-top: 12px !important; }
          .cinematic-hero .ch-rsvp-row { margin-top: 16px !important; }
          .cinematic-hero .ch-rsvp { width: 100% !important; padding: 14px 20px !important; }
          .cinematic-hero .ch-watermark { display: none !important; }
        }
      `}</style>
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
        className="ch-badges"
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
            gap: 6,
            padding: '7px 14px',
            background: typeBadge.background,
            color: typeBadge.color,
            border: `1px solid ${typeBadge.border}`,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          {typeBadge.pulse && (
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#FFFFFF',
                animation: 'ch-pulse 1.4s ease-in-out infinite',
              }}
            />
          )}
          {typeBadge.label}
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
              fontSize: 12,
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
      <div className="ch-countdown" style={{ position: 'absolute', top: 24, right: 24 }}>
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
          className="ch-watermark"
          style={{
            position: 'absolute',
            bottom: 18,
            right: 24,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 12,
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
        className="ch-content"
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
              fontSize: 12,
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

        {/* Title — Link to detail page */}
        <Link href={detailHref} style={{ color: 'inherit', textDecoration: 'none' }}>
          <h2
            className="ch-title"
            style={{
              margin: 0,
              fontFamily: '"Bebas Neue", sans-serif',
              fontWeight: 400,
              fontSize: 'clamp(40px, 6vw, 72px)',
              lineHeight: 1.02,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              textShadow: '0 2px 16px rgba(0,0,0,0.5)',
              wordBreak: 'break-word',
              cursor: 'pointer',
            }}
          >
            {event.title}
          </h2>
        </Link>

        {/* Tagline */}
        {event.tagline && (
          <p
            className="ch-tagline"
            style={{
              margin: '10px 0 0',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.85)',
              maxWidth: 720,
            }}
          >
            {event.tagline}
          </p>
        )}

        {/* Description */}
        {event.description && (
          <p
            className="ch-description"
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
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
          >
            {event.description}
          </p>
        )}

        {/* Host row */}
        {(event.host_name || event.host_role) && (
          <div
            className="ch-host"
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
                className="ch-host-avatar"
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
                className="ch-host-avatar"
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
                  className="ch-host-name"
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
                  className="ch-host-role"
                  style={{
                    margin: 0,
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
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
          className="ch-details"
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
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>
              {mounted ? (whenLabel || '—') : '—'}
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
        <div className="ch-rsvp-row" style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRsvpClick}
            disabled={rsvpInFlight}
            aria-pressed={rsvpd}
            aria-busy={rsvpInFlight}
            className="ch-rsvp"
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
            {rsvpd ? '✓ Going' : (event.cta_text?.trim() || 'RSVP')}
          </button>
          <Link
            href={detailHref}
            className="ch-rsvp"
            style={{
              padding: '14px 28px',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 15,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 0,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              minWidth: 160,
              justifyContent: 'center',
            }}
          >
            View Details →
          </Link>
        </div>
      </div>
    </section>
  )
}
