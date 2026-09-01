'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { isAcademyAd } from '@/lib/sponsors/partners'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { stripTrailingArrow } from '@/lib/brand'
import { HouseAdTracker } from '@/components/ads/HouseAdTracker'
import { IabImageAd } from '@/components/ads/IabImageAd'
import { isIabImageStill } from '@/lib/ads/iab'
import { inferHouseAdSlot, resolveServedAdHref } from '@/lib/ads/house'

const FB = 'var(--font-barlow)'
const FBC = 'var(--font-barlow-condensed)'
const FBN = 'var(--font-bebas)'
const NAVY = 'var(--pod-navy)'
const WHITE = 'var(--paper)'
const GOLD = 'var(--brand-gold)'
const GOLD_BRIGHT = 'var(--brand-gold-bright)'
const ACADEMY_ART_BG =
  'radial-gradient(120% 90% at 20% 0%, var(--navy) 0%, var(--navy-dark) 50%, var(--navy-abyss) 100%)'
const PARTNER_ART_BG =
  'linear-gradient(135deg, var(--navy-deep) 0%, var(--navy-dark) 46%, var(--navy) 78%, var(--brand-red) 150%)'

const DEFAULT_ROTATION_SECS = 8
const MIN_ROTATION_SECS = 4

const PILLAR_DOTS = [1, 2, 3, 4, 5, 6] as const

function href(ad: SponsorAd): string | null {
  return resolveServedAdHref(ad, isAcademyAd(ad))
}

/**
 * Evolution Partner / Academy unit sized to match PodcastCoverCard (9:16).
 * Meta lives inside the navy plate — same footprint as episode tiles so the
 * archive grid stays level on mobile and desktop.
 */
export function SquareSponsorCard({
  ad,
  showDisclosure = true,
}: {
  ad: SponsorAd
  showDisclosure?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  if (isIabImageStill(ad) && ad.image_url) {
    const still = (
      <article
        className="podcast-sponsor-cover"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '9 / 16',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--navy, #0A0F18)',
          border: '1px solid var(--podcast-border-soft2, rgba(255,255,255,0.08))',
        }}
      >
        <IabImageAd
          ad={{ ...ad, image_url: ad.image_url }}
          locationId="podcast"
          style={{ maxWidth: '100%', marginInline: 0 }}
        />
      </article>
    )
    return still
  }
  const link = href(ad)
  const academy = isAcademyAd(ad)
  const name = ad.sponsor_name ?? ad.tool_name ?? (academy ? 'Evolved Pros Academy' : 'Evolution Partner')
  const tagline = stripTrailingArrow(
    ad.headline ?? ad.endorsement_quote ?? (academy ? 'Stop collecting tips. Build the system.' : ''),
  )
  const badge = academy ? 'Academy' : 'Partner'
  const disclosure = academy ? 'Evolved Pros Academy' : 'Sponsored · Evolution Partner'

  const card = (
    <article
      className="podcast-sponsor-cover"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '9 / 16',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${hovered ? 'var(--brand-gold)' : 'var(--podcast-border-soft2)'}`,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 200ms ease, border-color 200ms ease',
        background: NAVY,
      }}
    >
      {/* Creative / logo region — shrinks; plate never clips */}
      <div
        style={{
          position: 'relative',
          flex: '1 1 0',
          minHeight: 0,
          overflow: 'hidden',
          background: academy ? ACADEMY_ART_BG : PARTNER_ART_BG,
        }}
      >
        {academy ? (
          <AcademyArt />
        ) : ad.image_url ? (
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
                objectPosition: 'center',
                padding: '8%',
                background: 'rgba(0,0,0,0.25)',
                transform: hovered ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 280ms ease',
              }}
            />
        ) : (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FBN,
              fontSize: 64,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '0.04em',
            }}
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}

        <span
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            padding: '3px 8px',
            background: academy ? 'rgba(201,168,76,0.18)' : GOLD,
            color: academy ? GOLD_BRIGHT : 'var(--navy-abyss)',
            border: academy ? '1px solid rgba(201,168,76,0.45)' : 'none',
            fontFamily: FBC,
            fontWeight: 800,
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            boxShadow: academy ? 'none' : '0 2px 8px rgba(201,168,76,0.35)',
          }}
        >
          {badge}
        </span>
      </div>

      {/* Navy plate — mirrors PodcastCoverCard */}
      <div
        style={{
          flex: '0 0 auto',
          background: NAVY,
          color: WHITE,
          padding: '12px 12px 11px',
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 24,
            height: 3,
            background: academy ? GOLD : 'var(--brand-red)',
            display: 'block',
          }}
        />
        <p
          style={{
            margin: '8px 0 0',
            fontFamily: FBC,
            fontWeight: 800,
            fontSize: 'clamp(11px, 3.2vw, 13px)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: WHITE,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {name}
        </p>
        {tagline && (
          <p
            style={{
              margin: '6px 0 0',
              fontFamily: FB,
              fontSize: 'clamp(11px, 3vw, 13px)',
              fontWeight: 500,
              lineHeight: 1.3,
              color: 'rgba(245,240,232,0.62)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {tagline}
          </p>
        )}
        {showDisclosure && (
          <p
            style={{
              margin: '10px 0 0',
              paddingTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.12)',
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 'clamp(8px, 2.4vw, 10px)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: GOLD,
            }}
          >
            {disclosure}
          </p>
        )}
      </div>
    </article>
  )

  if (!link) return card

  if (academy) {
    return (
      <HouseAdTracker
        ad={ad}
        slot={inferHouseAdSlot(ad)}
        locationId="podcast"
        className="no-underline block"
        ariaLabel={`${name} — Evolved Pros Academy`}
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        {card}
      </HouseAdTracker>
    )
  }

  const external = /^https?:\/\//i.test(link)
  if (external) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="no-underline block"
        aria-label={`${name} — Evolution Partner`}
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        {card}
      </a>
    )
  }

  return (
    <Link
      href={link}
      className="no-underline block"
      aria-label={`${name} — Evolution Partner`}
      style={{ color: 'inherit', textDecoration: 'none' }}
    >
      {card}
    </Link>
  )
}

/** Compact six-pillar art for Academy self-promo (no clipped PNG banners). */
function AcademyArt() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '16px 12px 14px',
        gap: 10,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: FBC,
          fontWeight: 800,
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: GOLD,
        }}
      >
        Evolved Architecture™
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display), Georgia, serif',
          fontWeight: 700,
          fontSize: 'clamp(16px, 5vw, 22px)',
          lineHeight: 1.1,
          color: WHITE,
          letterSpacing: '-0.01em',
        }}
      >
        Six pillars.
        <br />
        <span style={{ color: GOLD_BRIGHT }}>No ceiling.</span>
      </p>
      <ul
        style={{
          listStyle: 'none',
          margin: '4px 0 0',
          padding: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 4,
        }}
      >
        {PILLAR_DOTS.map(n => {
          const p = PILLAR_CONFIG[n]
          return (
            <li
              key={n}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 1,
                  background: p.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: FBC,
                  fontWeight: 700,
                  fontSize: 8,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'rgba(245,240,232,0.88)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {p.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * Rotating sponsor slot. Cycles the pool; `startIndex` staggers adjacent cards.
 */
export function RotatingSponsorCard({
  pool,
  startIndex = 0,
  showDisclosure = true,
}: {
  pool: SponsorAd[]
  startIndex?: number
  showDisclosure?: boolean
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
  return <SquareSponsorCard ad={pool[index % len]} showDisclosure={showDisclosure} />
}
