// Fit lockup: EVOLVED PR[barbell disc]S FIT. Bebas Neue + Podcast-family disc.
// The disc replaces the O in PROS. Theme-aware type via --text-primary.

import Link from 'next/link'
import { FIT_BARBELL_DISC, FIT_LOCKUP_LABEL } from '@/lib/lockups'

export function FitMastheadLockup({ href = '/fit' }: { href?: string }) {
  return (
    <h1 className="ep-fit-masthead-wordmark">
      <Link href={href} aria-label={FIT_LOCKUP_LABEL}>
        <span data-fit-evolved className="ep-fit-masthead-brand">
          EVOLVED
        </span>
        <span data-fit-pros className="ep-fit-masthead-pros">
          <span>PR</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-fit-mark
            className="ep-fit-masthead-disc"
            src={FIT_BARBELL_DISC}
            alt=""
            width={512}
            height={512}
            aria-hidden="true"
          />
          <span>S</span>
        </span>
        <span data-fit-section className="ep-fit-masthead-section">
          FIT
        </span>
      </Link>
    </h1>
  )
}

export function FitMasthead() {
  return (
    <header className="ep-fit-masthead">
      <div className="ep-fit-masthead-inner">
        <div className="ep-fit-masthead-utility">
          <Link href="/home" className="ep-fit-masthead-back">
            Back to platform
          </Link>
          <Link href="/pricing" className="ep-fit-masthead-join">
            Join Evolved Pros
          </Link>
        </div>
        <FitMastheadLockup />
      </div>
    </header>
  )
}
