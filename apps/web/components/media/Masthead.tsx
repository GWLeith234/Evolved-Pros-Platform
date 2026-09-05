// Centered Media lockup for /media. Shared by the hub and every article shell.
// EVOLVED PROS [megaphone in red circle] MEDIA. No newspaper nameplate.

import Link from 'next/link'
import { MediaMastheadRail } from '@/components/media/MediaMastheadRail'

function MegaphoneMark() {
  return (
    <span data-masthead-mark className="ep-media-masthead-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M16.881 4.317A2.25 2.25 0 0 1 21 6.196v11.608a2.25 2.25 0 0 1-4.119 1.88L13.5 16.5H8.25A5.25 5.25 0 0 1 3 11.25v-1.5A5.25 5.25 0 0 1 8.25 4.5h5.25l3.381-2.183Z" />
        <path d="M5.653 16.5h1.122a8.96 8.96 0 0 0-.252 1.44 2.25 2.25 0 0 1-2.365 2.054A2.25 2.25 0 0 1 2.25 17.79c0-.332.034-.658.099-.976a.75.75 0 0 1 .743-.624h2.56Z" />
      </svg>
    </span>
  )
}

export function MediaMastheadLockup() {
  return (
    <h1 className="ep-media-masthead-wordmark">
      <Link href="/media" aria-label="Evolved Pros Media">
        <span data-masthead-evolved className="ep-media-masthead-brand">
          Evolved Pros
        </span>
        <MegaphoneMark />
        <span data-masthead-section className="ep-media-masthead-section">
          Media
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
