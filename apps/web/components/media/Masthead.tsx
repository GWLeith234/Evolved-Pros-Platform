// Editorial masthead for /media — live chrome only.
// Section-hash nav, issue counter, and Search control are gone.

import Link from 'next/link'

const NETWORK_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'Community', href: '/community' },
  { label: 'Events', href: '/events' },
  { label: 'Podcast', href: '/podcast' },
  { label: 'Live', href: '/live' },
]

export function Masthead() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <header style={{ background: '#F5F0E8', borderBottom: '1px solid #E5E0D8', maxWidth: '100%', overflowX: 'hidden' }}>
      <div
        className="ed-masthead-date-strip"
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '14px 16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#6B7280',
          flexWrap: 'nowrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <span suppressHydrationWarning className="hidden sm:inline">{today}</span>
          <span aria-hidden="true" className="hidden sm:inline" style={{ color: '#C9A84C' }}>·</span>
          <Link
            href="/home"
            style={{ color: '#112535', textDecoration: 'none' }}
          >
            Back to platform
          </Link>
          <span aria-hidden="true" className="hidden sm:inline" style={{ color: '#C9A84C' }}>·</span>
          <Link
            href="/pricing"
            className="hidden sm:inline"
            style={{ color: '#112535', textDecoration: 'none' }}
          >
            Join Evolved Pros
          </Link>
        </span>
        <span
          className="ed-network-links"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            flexShrink: 1,
            minWidth: 0,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          {NETWORK_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{ color: '#112535', textDecoration: 'none', flexShrink: 0 }}
            >
              {link.label}
            </a>
          ))}
        </span>
      </div>

      <style>{`
        .ed-network-links::-webkit-scrollbar { display: none; }
        @media (max-width: 639px) {
          .ed-masthead-date-strip { flex-wrap: wrap !important; padding-right: 16px !important; row-gap: 8px; }
          .ed-network-links { width: 100%; padding-right: 8px; }
        }
      `}</style>

      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '20px 24px 12px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <h1
          style={{
            margin: '6px 0 0',
            fontFamily: 'var(--font-abril), "Abril Fatface", "Playfair Display", Georgia, serif',
            fontWeight: 400,
            fontSize: 'clamp(40px, 9vw, 108px)',
            lineHeight: 0.95,
            letterSpacing: '0.005em',
            color: '#112535',
          }}
        >
          <Link href="/media" style={{ color: 'inherit', textDecoration: 'none' }}>
            <span
              data-masthead-evolved
              style={{
                color: '#C9302A',
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 900,
              }}
            >
              Evolved
            </span>{' '}
            <span data-masthead-media style={{ color: '#112535' }}>Media</span>
          </Link>
        </h1>
        <p
          style={{
            margin: '10px 0 0',
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 16,
            color: '#6B7280',
          }}
        >
          Promoting evolution &mdash; the topics George is actively researching, learning, and teaching.
        </p>
      </div>

      <div style={{ maxWidth: 1280, margin: '8px auto 14px', padding: '0 24px' }}>
        <div style={{ height: 1, background: '#C9A84C' }} />
        <div style={{ height: 3, background: 'transparent' }} />
        <div style={{ height: 1, background: '#C9A84C' }} />
      </div>
    </header>
  )
}
