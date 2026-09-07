// Fit lockup: theme-swapped fit-lockup PNG (EVOLVED PR[barbell disc]S FIT).
// Same FooterLogo / loader CSS pair as Media. Disc replaces the O in PROS.

import Link from 'next/link'
import { FIT_LOCKUP_DARK, FIT_LOCKUP_LABEL, FIT_LOCKUP_LIGHT } from '@/lib/lockups'

export function FitMastheadLockup({ href = '/fit' }: { href?: string }) {
  return (
    <h1 className="ep-fit-masthead-wordmark">
      <Link href={href} aria-label={FIT_LOCKUP_LABEL}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-fit-lockup-dark
          className="ep-fit-masthead-logo ep-fit-masthead-logo--on-dark"
          src={FIT_LOCKUP_DARK}
          alt=""
          width={2400}
          height={600}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-fit-lockup-light
          className="ep-fit-masthead-logo ep-fit-masthead-logo--on-light"
          src={FIT_LOCKUP_LIGHT}
          alt=""
          width={2400}
          height={600}
        />
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
