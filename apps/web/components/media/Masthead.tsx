// Media masthead for /media. Phase 1 home: official wordmark (red interpunct)
// plus Media lockup (Bebas MEDIA + red megaphone disc). Surface name is
// Evolved Pros Media. Theme tokens carry light + dark. No host branch.

import Link from 'next/link'
import { EpWordmarkMark } from '@/components/brand/EpWordmark'
import { MEDIA_LOCKUP_LABEL, MEDIA_MEGAPHONE_DISC } from '@/lib/lockups'
import { MediaMastheadRail } from '@/components/media/MediaMastheadRail'

export function MediaMastheadLockup() {
  return (
    <h1 className="ep-media-masthead-wordmark">
      <Link href="/media" aria-label={MEDIA_LOCKUP_LABEL} className="ep-media-masthead-lockup">
        <span className="ep-media-masthead-pros" data-testid="ep-wordmark">
          <EpWordmarkMark />
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="ep-media-masthead-disc"
          src={MEDIA_MEGAPHONE_DISC}
          alt=""
          width={56}
          height={56}
          decoding="sync"
          {...{ fetchpriority: 'high' }}
        />
        <span className="ep-media-masthead-media">MEDIA</span>
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
