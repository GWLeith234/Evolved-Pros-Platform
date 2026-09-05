// Platform wordmark for /media. Shared by the hub and every article shell.
// EP lockup + Media section label. No newspaper nameplate.

import Image from 'next/image'
import Link from 'next/link'
import { logos } from '@evolved-pros/ui'
import { MediaMastheadRail } from '@/components/media/MediaMastheadRail'

const WORDMARK_HEIGHT = 36
const WORDMARK_WIDTH = WORDMARK_HEIGHT * 5

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

        <h1 className="ep-media-masthead-wordmark">
          <Link href="/media" aria-label="Evolved Pros Media">
            <Image
              src={logos.horizontalDark}
              alt=""
              width={WORDMARK_WIDTH}
              height={WORDMARK_HEIGHT}
              sizes={`${WORDMARK_WIDTH}px`}
              className="ep-media-masthead-logo ep-media-masthead-logo--on-dark"
              priority
            />
            <Image
              src={logos.horizontalNavy}
              alt=""
              width={WORDMARK_WIDTH}
              height={WORDMARK_HEIGHT}
              sizes={`${WORDMARK_WIDTH}px`}
              className="ep-media-masthead-logo ep-media-masthead-logo--on-light"
              priority
            />
            <span data-masthead-section className="ep-media-masthead-section">
              Media
            </span>
          </Link>
        </h1>

        <MediaMastheadRail />
      </div>
    </header>
  )
}
