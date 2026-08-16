// Editorial masthead for /media — ported from
// _design_refs/platform-handoff-2026-04-29/components/media/media-masthead.jsx
// (MediaMasthead). EdShare sub-component intentionally excluded; share UI
// lands in MR4 (per SPRINT_BRIEF section 4.3 + 6).

import Link from 'next/link'

const NAV_ITEMS: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'Top Stories', href: '#top' },
  { label: 'Revenue', href: '#revenue' },
  { label: 'AI', href: '#ai' },
  { label: 'Leadership', href: '#leadership' },
  { label: 'Pillars', href: '#pillars' },
  { label: "George’s Desk", href: '#desk' },
]

const NETWORK_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'Community', href: '/community' },
  { label: 'Events', href: '/events' },
  { label: 'Podcast', href: '/podcast' },
  { label: 'Live', href: '/live' },
]

interface MastheadProps {
  activeNav?: string
  issueNumber?: string
}

export function Masthead({ activeNav = 'Top Stories', issueNumber = '№ 0421' }: MastheadProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <header style={{ background: '#F5F0E8', borderBottom: '1px solid #E5E0D8', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Date strip — on mobile (< 640px) the date / Join Evolved Pros / issue
          number get hidden so the row collapses to BACK TO PLATFORM +
          Community/Events/Podcast/Live, which already crowded out at 390px. */}
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
          fontFamily: 'var(--font-condensed), sans-serif',
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
          <span className="hidden sm:inline" style={{ color: '#C9A84C' }}>Issue {issueNumber}</span>
          <span aria-hidden="true" className="hidden sm:inline" style={{ width: 1, height: 12, background: '#E5E0D8' }} />
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

      {/* Hide horizontal scrollbar on the network-links strip without losing
          the swipe gesture on touch devices. */}
      <style>{`
        .ed-network-links::-webkit-scrollbar { display: none; }
        /* MOBILE-MEDIA-FIX: at <640px "BACK TO PLATFORM" + the network links
           were crowding the row and clipping COMMUN[ity]. Push the network
           links to a second flexed row on mobile and give the strip a
           trailing pad so nothing renders flush to the right edge. */
        @media (max-width: 639px) {
          .ed-masthead-date-strip { flex-wrap: wrap !important; padding-right: 16px !important; row-gap: 8px; }
          .ed-network-links { width: 100%; padding-right: 8px; }
        }
      `}</style>

      {/* Masthead title */}
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
            fontFamily: 'var(--font-abril), var(--font-display), Georgia, serif',
            fontWeight: 400,
            fontSize: 'clamp(40px, 9vw, 108px)',
            lineHeight: 0.95,
            letterSpacing: '0.005em',
            color: '#112535',
          }}
        >
          <span style={{ color: '#C9302A' }}>Evolved</span>{' '}
          <span style={{ color: '#112535' }}>Media</span>
        </h1>
        <p
          style={{
            margin: '10px 0 0',
            fontFamily: 'var(--font-display), Georgia, serif',
            fontStyle: 'italic',
            fontSize: 16,
            color: '#6B7280',
          }}
        >
          Promoting evolution &mdash; the topics George is actively researching, learning, and teaching.
        </p>
      </div>

      {/* Hairlines */}
      <div style={{ maxWidth: 1280, margin: '8px auto 0', padding: '0 24px' }}>
        <div style={{ height: 1, background: '#C9A84C' }} />
        <div style={{ height: 3, background: 'transparent' }} />
        <div style={{ height: 1, background: '#C9A84C' }} />
      </div>

      {/* Category nav */}
      <nav
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '12px 24px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        {NAV_ITEMS.map(item => {
          const active = item.label === activeNav
          return (
            <a
              key={item.label}
              href={item.href}
              style={{
                position: 'relative',
                padding: '6px 10px',
                fontFamily: 'var(--font-condensed), sans-serif',
                fontWeight: active ? 700 : 600,
                fontSize: 13,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: active ? '#C9302A' : '#112535',
                textDecoration: 'none',
                borderBottom: active ? '2px solid #C9302A' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {item.label}
            </a>
          )
        })}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          aria-label="Search"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid #E5E0D8',
            color: '#112535',
            cursor: 'pointer',
            fontFamily: 'var(--font-condensed), sans-serif',
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          Search
        </button>
      </nav>
    </header>
  )
}
