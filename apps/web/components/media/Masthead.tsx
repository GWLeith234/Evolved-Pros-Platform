// Centered Media lockup for /media. Shared by the hub and every article shell.
// EVOLVED [megaphone disc] MEDIA. Bebas Neue + Podcast-family disc. No newspaper nameplate.

import Link from 'next/link'
import { MEDIA_LOCKUP_LABEL, MEDIA_MEGAPHONE_DISC } from '@/lib/lockups'
import { MediaMastheadRail } from '@/components/media/MediaMastheadRail'

export function MediaMastheadLockup() {
  return (
    <h1 className="ep-media-masthead-wordmark">
      <Link href="/media" aria-label={MEDIA_LOCKUP_LABEL}>
        <span data-masthead-evolved className="ep-media-masthead-brand">
          EVOLVED
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-masthead-mark
          className="ep-media-masthead-disc"
          src={MEDIA_MEGAPHONE_DISC}
          alt=""
          width={512}
          height={512}
          aria-hidden="true"
        />
        <span data-masthead-section className="ep-media-masthead-section">
          MEDIA
        </span>
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
