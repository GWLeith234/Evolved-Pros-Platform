import { gradients } from '@evolved-pros/ui'
import type { CommunityAd } from '@/lib/community/types'
import { stripTrailingArrow } from '@/lib/brand'

interface FeedAdUnitProps {
  ad: CommunityAd
}

/** In-feed Evolution Partner unit — theme tokens + shared Button CTA (Sprint 2). */
export function FeedAdUnit({ ad }: FeedAdUnitProps) {
  const href = [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? null
  const label = ad.headline ?? ad.tool_name ?? ad.sponsor_name ?? 'Sponsored'
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
      <span
        style={{
          position: 'absolute',
          top: 8,
          right: 12,
          fontFamily: 'var(--font-condensed), sans-serif',
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

      <div
        style={{
          width: 40,
          height: 40,
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
            style={{ width: 40, height: 40, objectFit: 'cover' }}
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
            fontFamily: 'var(--font-condensed), sans-serif',
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
              fontFamily: 'var(--font-condensed), sans-serif',
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
          fontFamily: 'var(--font-condensed), sans-serif',
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
