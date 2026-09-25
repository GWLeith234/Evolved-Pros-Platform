// Podcast lockup: theme-swapped podcast-lockup PNG
// (EVOLVED PR[mic disc]S PODCAST). Same FooterLogo / loader CSS pair
// as Fit/Media. Never type the family wordmark.

import Link from 'next/link'
import {
  LOCKUP_INTRINSIC_HEIGHT,
  LOCKUP_INTRINSIC_WIDTH,
  PODCAST_LOCKUP_DARK,
  PODCAST_LOCKUP_LABEL,
  PODCAST_LOCKUP_LIGHT,
} from '@/lib/lockups'

const FB = 'var(--font-barlow)'

export function PodcastMastheadLockup({ heading = false }: { heading?: boolean } = {}) {
  const Tag = heading ? 'h1' : 'div'
  return (
    <Tag className="ep-podcast-masthead-wordmark">
      <Link href="/podcast" aria-label={PODCAST_LOCKUP_LABEL}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-podcast-lockup-dark
          className="ep-podcast-masthead-logo ep-podcast-masthead-logo--on-dark"
          src={PODCAST_LOCKUP_DARK}
          alt=""
          width={LOCKUP_INTRINSIC_WIDTH}
          height={LOCKUP_INTRINSIC_HEIGHT}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-podcast-lockup-light
          className="ep-podcast-masthead-logo ep-podcast-masthead-logo--on-light"
          src={PODCAST_LOCKUP_LIGHT}
          alt=""
          width={LOCKUP_INTRINSIC_WIDTH}
          height={LOCKUP_INTRINSIC_HEIGHT}
        />
      </Link>
    </Tag>
  )
}

export function PodcastMasthead({ heading = false }: { heading?: boolean } = {}) {
  return (
    <header
      className="ep-podcast-masthead"
      style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 1280,
        margin: '0 auto',
        padding: '32px 24px 24px',
        borderBottom: '1px solid var(--podcast-border-soft2)',
        fontFamily: FB,
      }}
    >
      <PodcastMastheadLockup heading={heading} />
      <p
        style={{
          margin: '12px 0 0',
          fontFamily: FB,
          fontSize: 16,
          lineHeight: 1.5,
          color: 'var(--podcast-text-2)',
          maxWidth: 640,
        }}
      >
        Real conversations with the pros who are crushing it. From the field, from the trenches, and in real life.
      </p>
    </header>
  )
}
