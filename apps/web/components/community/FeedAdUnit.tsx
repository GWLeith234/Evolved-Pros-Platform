import type { CommunityAd } from '@/lib/community/types'

interface FeedAdUnitProps {
  ad: CommunityAd
}

export function FeedAdUnit({ ad }: FeedAdUnitProps) {
  const href = [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? null
  const label = ad.headline ?? ad.tool_name ?? ad.sponsor_name ?? 'Sponsored'
  const cta = ad.cta_text ?? 'Learn More →'

  const inner = (
    <div
      style={{
        position: 'relative',
        backgroundColor: '#111926',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '10px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Sponsored label */}
      <span
        style={{
          position: 'absolute',
          top: '7px',
          right: '10px',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 600,
          fontSize: '8px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.2)',
        }}
      >
        Sponsored
      </span>

      {/* Icon */}
      <div
        style={{
          width: '36px',
          height: '36px',
          flexShrink: 0,
          backgroundColor: '#ef0e30',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {ad.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.image_url} alt={label} style={{ width: '36px', height: '36px', objectFit: 'cover' }} />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 9h6M9 12h6M9 15h4"/>
          </svg>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '13px', color: 'white', lineHeight: 1.2, marginBottom: '1px' }}>
          {label}
        </p>
        {ad.sponsor_name && ad.headline && (
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.2 }}>
            {ad.sponsor_name}
          </p>
        )}
      </div>

      {/* CTA */}
      <div
        style={{
          flexShrink: 0,
          backgroundColor: '#C9302A',
          color: 'white',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          fontSize: '9px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '6px 12px',
          borderRadius: '5px',
          whiteSpace: 'nowrap',
        }}
      >
        {cta}
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
        {inner}
      </a>
    )
  }
  return inner
}
