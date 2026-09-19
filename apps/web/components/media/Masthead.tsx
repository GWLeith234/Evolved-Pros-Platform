// Media masthead for /media. Theme-swapped gold lockup PNG
// (EVOLVED PR [megaphone disc] S MEDIA). Same FooterLogo / Fit CSS pair.
// Not a composed HTML wordmark + disc + MEDIA label. No plate / navy island.

import Link from 'next/link'
import {
  LOCKUP_INTRINSIC_HEIGHT,
  LOCKUP_INTRINSIC_WIDTH,
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
          data-media-lockup-dark
          className="ep-media-masthead-logo ep-media-masthead-logo--on-dark"
          src={MEDIA_LOCKUP_DARK}
          alt=""
          width={LOCKUP_INTRINSIC_WIDTH}
          height={LOCKUP_INTRINSIC_HEIGHT}
          decoding="sync"
          {...{ fetchpriority: 'high' }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-media-lockup-light
          className="ep-media-masthead-logo ep-media-masthead-logo--on-light"
          src={MEDIA_LOCKUP_LIGHT}
          alt=""
          width={LOCKUP_INTRINSIC_WIDTH}
          height={LOCKUP_INTRINSIC_HEIGHT}
          decoding="sync"
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
