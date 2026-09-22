'use client'

import { useState, type CSSProperties } from 'react'
import { stripTrailingArrow } from '@/lib/brand'
import { IabAdvertisementSlot } from '@/components/ads/IabImageAd'
import { AdPlane } from '@/components/ads/AdPlane'
import { isIabImageStill } from '@/lib/ads/iab'

type SponsorAd = {
  id: string
  image_url: string | null
  headline: string | null
  tool_name: string | null
  endorsement_quote: string | null
  special_offer: string | null
  cta_text: string | null
  link_url: string | null
  click_url?: string | null
  sponsor_name?: string | null
  ad_type?: string | null
  title?: string | null
  body_copy?: string | null
  zone?: string | null
}

interface SponsorCardProps {
  ad: SponsorAd
  variant: 'academy' | 'community' | 'events'
}

/**
 * Native partner unit - the copy-carrying card, for rows that are not a plain
 * IAB still (those short-circuit to IabAdvertisementSlot below).
 *
 * SPRINT M - RESERVED COLOURS ARE GONE FROM THIS CARD.
 *
 * It used to wear #C9302A on a badge and a left accent bar, and its CTA was
 * `gradients.primary` - literally #ef0e30, the platform's own action colour, on
 * a button inside an ad. A reader had no way to tell that button from a real
 * Evolved Pros control. Every one of those is now an --ad-plane-* neutral, and
 * the whole card sits inside <AdPlane> like every other unit.
 *
 * Hover is a border and a lift only. Nothing borrows brand colour.
 */
export function SponsorCard({ ad, variant }: SponsorCardProps) {
  const [hover, setHover] = useState(false)

  if (isIabImageStill(ad) && ad.image_url) {
    return <IabAdvertisementSlot ad={{ ...ad, image_url: ad.image_url }} locationId={variant} />
  }

  const ctaText = stripTrailingArrow(ad.cta_text || 'Learn More')

  const offer = ad.special_offer ? (
    <span
      className="inline-block font-condensed font-bold uppercase mt-2"
      style={{
        fontSize: 12,
        color: 'var(--ad-plane-label)',
        border: '1px solid var(--ad-plane-line)',
        borderRadius: 0,
        padding: '2px 8px',
      }}
    >
      {ad.special_offer}
    </span>
  ) : null

  const shellStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    padding: 14,
    border: `1px solid var(--ad-plane-line)`,
    background: 'transparent',
    transform: hover ? 'translateY(-1px)' : 'none',
    transition: 'border-color 160ms ease, transform 160ms ease',
    borderRadius: 0,
  }

  const content = (
    <div className="flex gap-3">
      <div className="flex-1 min-w-0">
        {ad.tool_name && (
          <p
            className="font-condensed font-bold"
            style={{ color: 'var(--ad-plane-label)', fontSize: variant === 'events' ? 16 : 14 }}
          >
            {ad.tool_name}
          </p>
        )}
        {ad.endorsement_quote && (
          <p className="font-body italic mt-1" style={{ color: 'var(--ad-plane-label)', fontSize: 12 }}>
            &ldquo;{ad.endorsement_quote}&rdquo;
          </p>
        )}
        {offer}
        <div className="mt-3">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              minHeight: 32,
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              // Neutral, never the platform's red. An ad's CTA must not be
              // mistakable for an Evolved Pros action.
              background: 'transparent',
              color: 'var(--ad-plane-label)',
              border: '1px solid var(--ad-plane-line)',
              borderRadius: 0,
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
            width: 48,
            height: 48,
            objectFit: 'contain',
            flexShrink: 0,
          }}
        />
      )}
    </div>
  )

  const card = (
    <div
      style={shellStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {content}
    </div>
  )

  const inner = ad.link_url ? (
    <a href={ad.link_url} target="_blank" rel="noopener noreferrer sponsored" className="block w-full">
      {card}
    </a>
  ) : (
    card
  )

  return (
    <AdPlane label="Sponsored" data={{ 'data-ad-card': variant }}>
      {inner}
    </AdPlane>
  )
}
