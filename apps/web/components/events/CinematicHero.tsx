'use client'

import { useEffect, useState } from 'react'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

// Mirrors the events row shape we actually need on the hero. Defining it
// inline (vs Database['public']['Tables']['events']) keeps the component
// independent of generated types churn.
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
}

interface CinematicHeroProps {
  event: HeroEvent | null
  initialIsRsvpd?: boolean
}

const FORMAT_VAR: Record<string, string> = {
  'live':       'var(--events-format-live)',
  'in-person':  'var(--events-format-in-person)',
  'podcast':    'var(--events-format-podcast)',
  'replay':     'var(--events-format-replay)',
}

const FORMAT_LABEL: Record<string, string> = {
  'live':      'LIVE',
  'in-person': 'IN-PERSON',
  'podcast':   'PODCAST',
  'replay':    'REPLAY',
}

function formatTier(tier: string | null): string {
  if (!tier) return 'MEMBER'
  return tier.toUpperCase()
}

function formatWhen(iso: string): string {
  // "Apr 30 · 7:00 PM PT" style. Server and client may compute different
  // tz strings; render this client-side from a stable seed so SSR/client
  // first paint match (component is 'use client' — first paint runs once
  // on hydration with the same Date input).
  const d = new Date(iso)
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${datePart} · ${timePart}`.toUpperCase()
}

function countdownLabel(iso: string, nowMs: number): string {
  const target = new Date(iso).getTime()
  const diffMs = target - nowMs
  if (diffMs <= 0) return 'STARTING NOW'
  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `STARTS IN ${days}D ${hours}H`
  if (hours > 0) return `STARTS IN ${hours}H ${minutes}M`
  if (minutes >= 1) return `STARTS IN ${minutes}M`
  return `STARTS IN ${seconds}S`
}

function truncate(s: string | null, n: number): string {
  if (!s) return ''
  if (s.length <= n) return s
  return s.slice(0, n - 1).trimEnd() + '…'
}

const HERO_HEIGHT = 560

export function CinematicHero({ event, initialIsRsvpd = false }: CinematicHeroProps) {
  // Ticking clock for the countdown. Default to 60s tick; switch to 1s
  // when the event is within 60s. Initial nowMs is null on SSR to avoid
  // hydration mismatch — the countdown pill renders nothing until mount.
  const [nowMs, setNowMs] = useState<number | null>(null)
  const [rsvpd, setRsvpd] = useState(initialIsRsvpd)
  const [rsvpInFlight, setRsvpInFlight] = useState(false)
  const [shareLabel, setShareLabel] = useState<'SHARE' | 'COPIED ✓'>('SHARE')

  useEffect(() => {
    if (!event) return
    const tick = () => setNowMs(Date.now())
    tick()
    const targetMs = new Date(event.starts_at).getTime()
    const interval = targetMs - Date.now() < 60_000 ? 1000 : 60_000
    const handle = window.setInterval(tick, interval)
    return () => window.clearInterval(handle)
  }, [event])

  if (!event) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          height: HERO_HEIGHT,
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
      </div>
    )
  }

  const pillarConf = event.pillar && event.pillar >= 1 && event.pillar <= 6
    ? PILLAR_CONFIG[event.pillar]
    : null

  const formatLabel = FORMAT_LABEL[event.format] ?? String(event.format).toUpperCase()
  const formatColor = FORMAT_VAR[event.format] ?? 'var(--events-format-replay)'
  const coverUrl = event.hero_image_url ?? event.image_url ?? null
  const fallbackBg = pillarConf
    ? `linear-gradient(135deg, ${pillarConf.color}33 0%, ${pillarConf.color}11 100%), var(--bg-elevated)`
    : 'var(--bg-elevated)'

  const startsMs = new Date(event.starts_at).getTime()
  const minutesUntil = nowMs !== null ? (startsMs - nowMs) / 60_000 : Infinity
  const showLivePulse = event.format === 'live' && minutesUntil <= 60 && minutesUntil > -10
  const countdown = nowMs !== null ? countdownLabel(event.starts_at, nowMs) : ''

  async function handleRsvpClick() {
    if (rsvpInFlight) return
    const wasRsvpd = rsvpd
    // Optimistic
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

  async function handleShareClick() {
    if (typeof window === 'undefined') return
    const url = `${window.location.origin}/events/${event!.id}`
    try {
      await navigator.clipboard?.writeText(url)
    } catch {
      // Ignore — clipboard may be unavailable in non-secure contexts.
    }
    setShareLabel('COPIED ✓')
    window.setTimeout(() => setShareLabel('SHARE'), 1500)
  }

  const pillStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    background: 'var(--events-hero-pill-bg)',
    border: '1px solid var(--events-hero-pill-border)',
    color: '#FFFFFF',
    fontFamily: '"Barlow Condensed", sans-serif',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
  }

  return (
    <section
      style={{
        position: 'relative',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        height: HERO_HEIGHT,
        overflow: 'hidden',
        background: coverUrl ? '#000' : fallbackBg,
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

      {/* Gradient overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, var(--events-hero-overlay-from) 0%, var(--events-hero-overlay-to) 100%)',
        }}
      />

      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          right: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={pillStyle}>
          {showLivePulse && (
            <span
              aria-hidden="true"
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: formatColor,
                animation: 'events-live-pulse 1.4s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
          )}
          <span style={{ color: formatColor }}>{formatLabel}</span>
        </span>

        {countdown && (
          <span style={pillStyle} aria-live="polite">
            {countdown}
          </span>
        )}
      </div>

      {/* Content block */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          left: 48,
          right: 48,
          maxWidth: 720,
        }}
      >
        {pillarConf && (
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              background: `${pillarConf.color}2E`,
              border: `1px solid ${pillarConf.color}55`,
              color: pillarConf.color,
              marginBottom: 16,
            }}
          >
            {pillarConf.label}
          </span>
        )}

        <h2
          style={{
            margin: 0,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            fontSize: 'clamp(40px, 5.5vw, 56px)',
            lineHeight: 1.05,
            color: '#FFFFFF',
            letterSpacing: '-0.005em',
          }}
        >
          {event.title}
        </h2>

        {event.description && (
          <p
            style={{
              margin: '24px 0 0',
              fontFamily: '"Barlow", sans-serif',
              fontSize: 18,
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.78)',
            }}
          >
            {truncate(event.description, 180)}
          </p>
        )}

        <div
          style={{
            marginTop: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.78)',
          }}
        >
          <span>
            <ClientWhen iso={event.starts_at} />
          </span>
          <span>
            {formatLabel} · {formatTier(event.required_tier)}
          </span>
        </div>

        <div
          style={{
            marginTop: 32,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={handleRsvpClick}
            disabled={rsvpInFlight}
            aria-pressed={rsvpd}
            style={{
              padding: '14px 28px',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 14,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: rsvpd ? 'var(--events-rsvp-active)' : 'var(--events-format-live)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 0,
              cursor: rsvpInFlight ? 'wait' : 'pointer',
              transition: 'background 160ms ease',
            }}
          >
            {rsvpd ? '✓ Added' : '+ Add to my events'}
          </button>

          <button
            type="button"
            onClick={handleShareClick}
            style={{
              padding: '14px 28px',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 14,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: 0,
              cursor: 'pointer',
              transition: 'border-color 160ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)' }}
          >
            {shareLabel}
          </button>
        </div>
      </div>
    </section>
  )
}

// Defers Date construction to client-only — avoids SSR/client tz mismatch (#425).
function ClientWhen({ iso }: { iso: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => { setLabel(formatWhen(iso)) }, [iso])
  return <>{label}</>
}
