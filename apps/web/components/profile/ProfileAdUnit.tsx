interface Ad {
  headline?: string | null
  tool_name?: string | null
  cta_text?: string | null
  link_url?: string | null
  click_url?: string | null
  image_url?: string | null
  sponsor_name?: string | null
}

interface ProfileAdUnitProps {
  ad: Ad
}

export function ProfileAdUnit({ ad }: ProfileAdUnitProps) {
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
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}
    >
      {/* AD label */}
      <span
        style={{
          position: 'absolute',
          top: '8px',
          right: '10px',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          fontSize: '8px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)',
        }}
      >
        AD
      </span>

      {/* Icon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          flexShrink: 0,
          backgroundColor: '#ef0e30',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {ad.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.image_url} alt={label} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 9h6M9 12h6M9 15h4"/>
          </svg>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '13px', color: 'white', lineHeight: 1.2, marginBottom: '2px' }}>
          {label}
        </p>
        {ad.sponsor_name && ad.headline && (
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>
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
          fontSize: '11px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '7px 14px',
          borderRadius: '6px',
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
