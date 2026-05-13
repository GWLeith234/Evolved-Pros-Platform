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
    <header style={{ background: 'var(--ed-bg)', borderBottom: '1px solid var(--ed-border)', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Date strip — on mobile (< 640px) the date / Join Evolved Pros / issue
          number get hidden so the row collapses to BACK TO PLATFORM +
          Community/Events/Podcast/Live, which already crowded out at 390px. */}
      <div
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
          color: 'var(--ed-text-muted)',
          flexWrap: 'nowrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <span suppressHydrationWarning className="hidden sm:inline">{today}</span>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <Link
            href="/home"
            style={{ color: 'var(--ed-text)', textDecoration: 'none' }}
          >
            Back to platform
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <Link
            href="/pricing"
            className="hidden sm:inline"
            style={{ color: 'var(--ed-text)', textDecoration: 'none' }}
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
          <span className="hidden sm:inline">Issue {issueNumber}</span>
          <span aria-hidden="true" className="hidden sm:inline" style={{ width: 1, height: 12, background: 'var(--ed-border)' }} />
          {NETWORK_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{ color: 'var(--ed-text)', textDecoration: 'none', flexShrink: 0 }}
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
            fontFamily: '"Abril Fatface", "Playfair Display", Georgia, serif',
            fontWeight: 400,
            fontSize: 'clamp(40px, 9vw, 108px)',
            lineHeight: 0.95,
            letterSpacing: '0.005em',
            color: 'var(--ed-text)',
          }}
        >
          <span style={{ color: 'var(--ed-red)' }}>Evolved</span>{' '}
          <span style={{ color: 'var(--ed-navy)' }}>Media</span>
        </h1>
        <p
          style={{
            margin: '10px 0 0',
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 16,
            color: 'var(--ed-text-muted)',
          }}
        >
          Promoting evolution &mdash; the topics George is actively researching, learning, and teaching.
        </p>
      </div>

      {/* Hairlines */}
      <div style={{ maxWidth: 1280, margin: '8px auto 0', padding: '0 24px' }}>
        <div style={{ height: 1, background: 'var(--ed-text)' }} />
        <div style={{ height: 3, background: 'transparent' }} />
        <div style={{ height: 1, background: 'var(--ed-text)' }} />
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
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: active ? 700 : 600,
                fontSize: 13,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: active ? 'var(--ed-red)' : 'var(--ed-text)',
                textDecoration: 'none',
                borderBottom: active ? '2px solid var(--ed-red)' : '2px solid transparent',
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
            border: '1px solid var(--ed-border)',
            color: 'var(--ed-text)',
            cursor: 'pointer',
            fontFamily: '"Barlow Condensed", sans-serif',
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
