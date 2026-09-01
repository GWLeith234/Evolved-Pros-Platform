import { gradients } from '@evolved-pros/ui'
import type { CommunityAd } from '@/lib/community/types'
import { stripTrailingArrow } from '@/lib/brand'
import { isAcademyAd } from '@/lib/sponsors/partners'
import { HouseAdTracker } from '@/components/ads/HouseAdTracker'
import { IabImageAd } from '@/components/ads/IabImageAd'
import { isIabImageStill } from '@/lib/ads/iab'
import { inferHouseAdSlot, resolveServedAdHref } from '@/lib/ads/house'

interface FeedAdUnitProps {
  ad: CommunityAd
}

/** In-feed Evolution Partner unit — theme tokens + shared Button CTA (Sprint 2). */
export function FeedAdUnit({ ad }: FeedAdUnitProps) {
  if (isIabImageStill(ad) && ad.image_url) {
    return (
      <div style={{ marginBottom: 10 }}>
        <IabImageAd ad={{ ...ad, image_url: ad.image_url }} locationId="community-feed" />
      </div>
    )
  }

  const house = isAcademyAd(ad)
  const href = resolveServedAdHref(ad, house)
  const label = ad.headline ?? ad.tool_name ?? ad.sponsor_name ?? (house ? 'Evolved Pros Academy' : 'Sponsored')
  const cta = stripTrailingArrow(ad.cta_text ?? 'Learn More')

  const inner = (
    <div
      className="ep-sponsor-inline"
      style={{
        position: 'relative',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid var(--brand-red, #C9302A)',
        borderRadius: 0,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 10,
        transition: 'border-color 160ms ease, box-shadow 160ms ease',
      }}
    >
      {!house && (
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#0A0F18',
            background: 'var(--brand-gold, #C9A84C)',
            padding: '3px 8px',
            borderRadius: 3,
          }}
        >
          Partner
        </span>
      )}

      <div
        style={{
          width: 48,
          height: 48,
          flexShrink: 0,
          backgroundColor: 'rgba(201,48,42,0.12)',
          border: '1px solid rgba(201,48,42,0.28)',
          borderRadius: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {ad.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.image_url}
            alt={label}
            style={{ width: 48, height: 48, objectFit: 'cover' }}
          />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-red, #C9302A)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6M9 12h6M9 15h4" />
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
        <p
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 14,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            margin: '0 0 2px',
          }}
        >
          {label}
        </p>
        {ad.sponsor_name && ad.headline && (
          <p
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 12,
              color: 'var(--text-tertiary)',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {ad.sponsor_name}
          </p>
        )}
      </div>

      <span
        aria-hidden
        className="ep-btn ep-btn--primary"
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          padding: '6px 12px',
          minHeight: 32,
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          background: gradients?.primary ?? 'linear-gradient(135deg, #ef0e30 0%, #c50a26 100%)',
          color: '#FFFFFF',
          border: '1px solid transparent',
          borderRadius: 0,
        }}
      >
        {cta}
      </span>
    </div>
  )

  if (house) {
    return (
      <HouseAdTracker
        ad={ad}
        slot={inferHouseAdSlot(ad)}
        locationId="community-feed"
        style={{ display: 'block', textDecoration: 'none' }}
        ariaLabel={`${label} — Evolved Pros Academy`}
      >
        {inner}
      </HouseAdTracker>
    )
  }

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        style={{ display: 'block', textDecoration: 'none' }}
      >
        {inner}
      </a>
    )
  }
  return inner
}
