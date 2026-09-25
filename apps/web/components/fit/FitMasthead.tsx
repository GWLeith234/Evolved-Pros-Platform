// Fit lockup: theme-swapped fit-lockup PNG (EVOLVED PR[barbell disc]S FIT).
// Same FooterLogo / loader CSS pair as Media. Disc replaces the O in PROS.
// Gold header: lockup + VIP $99 pill. Never type the family wordmark.

import Link from 'next/link'
import { PublicGlobalNav } from '@/components/layout/PublicGlobalNav'
import { FIT_VIP_PILL } from '@/lib/fit/copy'
import { fitUpgradeHref } from '@/lib/fit/gating'
import {
  FIT_LOCKUP_DARK,
  FIT_LOCKUP_LABEL,
  FIT_LOCKUP_LIGHT,
  LOCKUP_INTRINSIC_HEIGHT,
  LOCKUP_INTRINSIC_WIDTH,
} from '@/lib/lockups'

export function FitMastheadLockup({
  href = '/fit',
  compact = false,
}: {
  href?: string
  compact?: boolean
}) {
  // Compact is the home tease, under the page H1. The /fit page lockup is the H1.
  const Tag = compact ? 'div' : 'h1'
  return (
    <Tag className={`ep-fit-masthead-wordmark${compact ? ' ep-fit-masthead-wordmark--compact' : ''}`}>
      <Link href={href} aria-label={FIT_LOCKUP_LABEL}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-fit-lockup-dark
          className="ep-fit-masthead-logo ep-fit-masthead-logo--on-dark"
          src={FIT_LOCKUP_DARK}
          alt=""
          width={LOCKUP_INTRINSIC_WIDTH}
          height={LOCKUP_INTRINSIC_HEIGHT}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-fit-lockup-light
          className="ep-fit-masthead-logo ep-fit-masthead-logo--on-light"
          src={FIT_LOCKUP_LIGHT}
          alt=""
          width={LOCKUP_INTRINSIC_WIDTH}
          height={LOCKUP_INTRINSIC_HEIGHT}
        />
      </Link>
    </Tag>
  )
}

export function FitVipPill({ href = fitUpgradeHref() }: { href?: string }) {
  return (
    <Link href={href} className="ep-fit-vip-pill">
      {FIT_VIP_PILL}
    </Link>
  )
}

/** SPRINT M - global nav rides above the section chrome so /fit is not a cul-de-sac. */
export function FitMasthead() {
  return (
    <>
      <PublicGlobalNav current="/fit" />
      <header className="ep-fit-masthead">
        <div className="ep-fit-masthead-inner">
          <div className="ep-fit-masthead-utility">
            <Link href="/home" className="ep-fit-masthead-back">
              Back to platform
            </Link>
            <FitVipPill />
          </div>
          <FitMastheadLockup />
        </div>
      </header>
    </>
  )
}
