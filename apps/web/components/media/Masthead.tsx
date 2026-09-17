// Full-width Media lockup for /media. Shared by the hub and every article shell.
// #150 theme-aware media-lockup PNG (EVOLVED [megaphone disc] MEDIA).
// Masthead sits on parchment (not a navy island). The lockup spans the
// content width across the top. Navy-letter LIGHT file is the visible mark
// on paper. DARK file stays in the pair for Fit-shared CSS and any future
// dark chrome. No host branch.

import Link from 'next/link'
import {
  MEDIA_LOCKUP_DARK,
  MEDIA_LOCKUP_LABEL,
  MEDIA_LOCKUP_LIGHT,
} from '@/lib/lockups'
import { MediaMastheadRail } from '@/components/media/MediaMastheadRail'

export function MediaMastheadLockup() {
  return (
    <h1 className="ep-media-masthead-wordmark">
      <Link href="/media" aria-label={MEDIA_LOCKUP_LABEL}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-masthead-lockup-dark
          className="ep-media-masthead-logo ep-media-masthead-logo--on-dark"
          src={MEDIA_LOCKUP_DARK}
          alt=""
          width={612}
          height={139}
          loading="lazy"
          decoding="async"
          {...{ fetchpriority: 'low' }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-masthead-lockup-light
          className="ep-media-masthead-logo ep-media-masthead-logo--on-light"
          src={MEDIA_LOCKUP_LIGHT}
          alt=""
          width={612}
          height={139}
          decoding="sync"
          {...{ fetchpriority: 'high' }}
        />
      </Link>
    </h1>
  )
}

export function Masthead() {
  return (
    <header className="ep-media-masthead">
      <div className="ep-media-masthead-inner">
        <div className="ep-media-masthead-utility">
          <Link href="/home" className="ep-media-masthead-back">
            Back to platform
          </Link>
          <Link href="/pricing" className="ep-media-masthead-join">
            Join Evolved Pros
          </Link>
        </div>

        <MediaMastheadLockup />

        <MediaMastheadRail />
      </div>
    </header>
  )
}
