'use client'

import { useState, type CSSProperties } from 'react'

type SponsorAd = {
  id: string
  image_url: string | null
  headline: string | null
  tool_name: string | null
  endorsement_quote: string | null
  special_offer: string | null
  cta_text: string | null
  link_url: string | null
}

interface SponsorCardProps {
  ad: SponsorAd
  variant: 'academy' | 'community' | 'events'
}

const RED = '#C9302A'

export function SponsorCard({ ad, variant }: SponsorCardProps) {
  const ctaText = ad.cta_text || 'Learn More →'
  const [hover, setHover] = useState(false)

  const badge = (
    <span
      style={{
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 800,
        fontSize: 9,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: RED,
        background: hover ? 'rgba(201,48,42,0.14)' : 'rgba(201,48,42,0.08)',
        border: `1px solid ${hover ? 'rgba(201,48,42,0.45)' : 'rgba(201,48,42,0.28)'}`,
        padding: '2px 7px',
        transition: 'background 160ms ease, border-color 160ms ease',
      }}
    >
      Evolution Partner
    </span>
  )

  const accentBar = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: RED,
      }}
    />
  )

  const hoverLine = (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: hover ? 80 : 0,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${RED})`,
        transition: 'width 220ms ease',
      }}
    />
  )

  const shellStyle = (extra?: CSSProperties): CSSProperties => ({
    position: 'relative',
    overflow: 'hidden',
    padding: 16,
    paddingLeft: 18,
    border: `1px solid ${hover ? `${RED}55` : 'var(--border-color, rgba(255,255,255,0.08))'}`,
    background: 'var(--bg-surface, #111926)',
    boxShadow: hover ? `0 8px 24px rgba(201,48,42,0.12)` : 'none',
    transform: hover ? 'translateY(-1px)' : 'none',
    transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
    ...extra,
  })

  const nameColor = 'var(--text-primary, #fff)'
  const quoteColor = 'var(--text-secondary, rgba(255,255,255,0.6))'

  const content = (
    <div className="flex gap-3">
      <div className="flex-1 min-w-0">
        <div style={{ marginBottom: 8 }}>{badge}</div>
        {ad.tool_name && (
          <p
            className="font-condensed font-bold"
            style={{ color: nameColor, fontSize: variant === 'events' ? 16 : 14 }}
          >
            {ad.tool_name}
          </p>
        )}
        {ad.endorsement_quote && (
          <p className="font-body italic mt-1" style={{ color: quoteColor, fontSize: 12 }}>
            &ldquo;{ad.endorsement_quote}&rdquo;
          </p>
        )}
        {ad.special_offer && (
          <span
            className="inline-block font-condensed font-bold uppercase mt-2"
            style={{
              fontSize: 12,
              color: RED,
              backgroundColor: 'rgba(201,48,42,0.10)',
              border: '1px solid rgba(201,48,42,0.35)',
              borderRadius: 0,
              padding: '2px 8px',
            }}
          >
            {ad.special_offer}
          </span>
        )}
        <div className="mt-2">
          <span
            className="font-condensed font-bold uppercase"
            style={{
              color: hover ? '#FFFFFF' : RED,
              background: hover ? RED : 'transparent',
              border: `1px solid ${RED}`,
              fontSize: 11,
              letterSpacing: '0.14em',
              padding: '4px 10px',
              display: 'inline-block',
              transition: 'color 160ms ease, background 160ms ease',
            }}
          >
            {ctaText}
          </span>
        </div>
      </div>

      {ad.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.image_url}
          alt={ad.tool_name ?? ''}
          style={{
            width: 40,
            height: 40,
            objectFit: 'contain',
            flexShrink: 0,
          }}
        />
      )}
    </div>
  )

  // All three variants share the same Evolution Partner treatment (red accent + badge + hover).
  // `variant` is kept for API compatibility with call sites.
  void variant

  const inner = (
    <div
      style={shellStyle()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {accentBar}
      {hoverLine}
      {content}
    </div>
  )

  if (ad.link_url) {
    return (
      <a href={ad.link_url} target="_blank" rel="noopener noreferrer sponsored" className="block">
        {inner}
      </a>
    )
  }

  return <div>{inner}</div>
}
