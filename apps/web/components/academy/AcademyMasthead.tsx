// Academy lockup: theme-swapped academy-lockup PNG
// (EVOLVED PR[grad-cap disc]S ACADEMY). Same FooterLogo / loader CSS pair
// as Fit/Media. Never type the family wordmark.

import Link from 'next/link'
import {
  ACADEMY_LOCKUP_DARK,
  ACADEMY_LOCKUP_LABEL,
  ACADEMY_LOCKUP_LIGHT,
  LOCKUP_INTRINSIC_HEIGHT,
  LOCKUP_INTRINSIC_WIDTH,
} from '@/lib/lockups'

export function AcademyMastheadLockup() {
  return (
    <h1 className="ep-academy-masthead-wordmark">
      <Link href="/academy" aria-label={ACADEMY_LOCKUP_LABEL}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-academy-lockup-dark
          className="ep-academy-masthead-logo ep-academy-masthead-logo--on-dark"
          src={ACADEMY_LOCKUP_DARK}
          alt=""
          width={LOCKUP_INTRINSIC_WIDTH}
          height={LOCKUP_INTRINSIC_HEIGHT}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-academy-lockup-light
          className="ep-academy-masthead-logo ep-academy-masthead-logo--on-light"
          src={ACADEMY_LOCKUP_LIGHT}
          alt=""
          width={LOCKUP_INTRINSIC_WIDTH}
          height={LOCKUP_INTRINSIC_HEIGHT}
        />
      </Link>
    </h1>
  )
}
