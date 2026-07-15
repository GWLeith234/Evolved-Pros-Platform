'use client'

import { useEffect, useState } from 'react'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { premiumPartnerKind } from '@/lib/sponsors/partners'
import { stripTrailingArrow } from '@/lib/brand'

// Type tokens shared with the episode tile so the sponsor unit reads as a
// sibling of the album-cover grid, not a bolt-on.
const FB = 'var(--font-barlow)'
const FBC = 'var(--font-barlow-condensed)'

/** Default hold before a slot advances when an ad omits rotation_interval. */
const DEFAULT_ROTATION_SECS = 8
/** Floor so a mis-configured 0/1s interval never spins the card. */
const MIN_ROTATION_SECS = 4

function href(ad: SponsorAd): string | null {
  return [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? null
}

/**
 * A single Evolution Partner unit sized to match a PodcastEpisodeTile exactly:
 * one grid cell wide, 2:3 portrait poster, sharp corners + soft border, meta
 * below (with the same reserved title height) so sponsor and episode cells are
 * visually identical in the grid. Uploaded creatives render full-bleed (cover);
 * known flagship partners (wordmark logos) get a designed poster — logo
 * contained on a brand gradient — so a banner-shaped logo never crops badly.
 */
export function SquareSponsorCard({ ad }: { ad: SponsorAd }) {
  const [hovered, setHovered] = useState(false)
  const link = href(ad)
  const name = ad.sponsor_name ?? ad.tool_name ?? 'Evolution Partner'
  const tagline = stripTrailingArrow(ad.headline ?? ad.endorsement_quote ?? '')
  const isFlagshipLogo = premiumPartnerKind(ad) !== null

  const poster = (
    <div
      className="podcast-tile-cover"
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        // 2:3 portrait — identical footprint to a PodcastEpisodeTile poster.
        aspectRatio: '2 / 3',
        overflow: 'hidden',
        borderRadius: 0,
        border: `1px solid ${hovered ? 'var(--brand-gold)' : 'var(--podcast-border-soft2)'}`,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 200ms ease, border-color 200ms ease',
        // Album-art region reads as its own dark surface in both themes, the
        // same way episode covers (photos) do.
        background: 'linear-gradient(135deg, #0A2530 0%, #101B2C 46%, #2A1416 78%, #C9302A 150%)',
      }}
    >
      {ad.image_url ? (
        isFlagshipLogo ? (
          // Wordmark logo — contain + breathing room so it never crops.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.image_url}
            alt={name}
            loading="lazy"
            decoding="async"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: '20%',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 280ms ease',
              filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.4))',
            }}
          />
        ) : (
          // Uploaded creative — full-bleed cover, cropped to the 2:3 tile.
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${ad.image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 280ms ease',
            }}
          />
        )
      ) : (
        // No creative — brand initial as album art.
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-bebas)',
            fontSize: 72,
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.04em',
          }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}

      {/* PARTNER chip — same gold-on-black grammar as the episode number chip. */}
      <span
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          padding: '3px 8px',
          background: 'var(--brand-gold, #C9A84C)',
          color: '#0A0F18',
          fontFamily: FBC,
          fontWeight: 800,
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          boxShadow: '0 2px 8px rgba(201,168,76,0.35)',
        }}
      >
        Partner
      </span>
    </div>
  )

  const meta = (
    <div style={{ padding: '16px 2px 0', textAlign: 'left' }}>
      <p
        style={{
          margin: '0 0 4px',
          fontFamily: FBC,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--podcast-text-1)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {name}
      </p>
      {/* Mirrors the episode tile's title block (size, clamp, reserved
          minHeight) so the meta area — and thus the whole card — matches an
          episode cell's height even when the tagline is short/absent. */}
      <p
        style={{
          margin: 0,
          fontFamily: FB,
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.25,
          color: 'var(--podcast-text-strong)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '2.5em',
        }}
      >
        {tagline}
      </p>
      <p
        style={{
          margin: '6px 0 0',
          fontFamily: FBC,
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'rgba(201,168,76,0.85)',
        }}
      >
        Sponsored · Evolution Partner
      </p>
    </div>
  )

  const body = (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {poster}
      {meta}
    </article>
  )

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="no-underline"
        aria-label={`${name} — Evolution Partner`}
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        {body}
      </a>
    )
  }
  return body
}

/**
 * A rotating sponsor slot. Cycles through the active, in-date pool, honoring
 * each ad's rotation_interval. `startIndex` staggers slots so two on-screen
 * cards don't show the same partner at the same moment. With a single-ad pool
 * it holds static (nothing to rotate to).
 */
export function RotatingSponsorCard({
  pool,
  startIndex = 0,
}: {
  pool: SponsorAd[]
  startIndex?: number
}) {
  const len = pool.length
  const [index, setIndex] = useState(len ? startIndex % len : 0)

  useEffect(() => {
    if (len <= 1) return
    const current = pool[index % len]
    const secs = Math.max(MIN_ROTATION_SECS, current.rotation_interval ?? DEFAULT_ROTATION_SECS)
    const t = setTimeout(() => setIndex(i => (i + 1) % len), secs * 1000)
    return () => clearTimeout(t)
  }, [index, len, pool])

  if (!len) return null
  return <SquareSponsorCard ad={pool[index % len]} />
}
