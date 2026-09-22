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
import { ALL_MEDIA_SECTIONS, type DeskSectionDef } from '@/lib/media/desk'
import { MediaMastheadRail } from '@/components/media/MediaMastheadRail'
import { PublicGlobalNav } from '@/components/layout/PublicGlobalNav'

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

/**
 * SPRINT M - `sections` is the set of pillars that actually have published
 * stories, resolved in the /media layout and handed down. It is a prop, not an
 * import, so this module stays free of the admin Supabase client: two render
 * tests mount MediaMastheadLockup from here and would otherwise have to boot a
 * service-role client to do it.
 *
 * The global platform nav rides above, so /media is not a "Back to platform"
 * cul-de-sac any more.
 */
export function Masthead({
  sections = ALL_MEDIA_SECTIONS,
}: {
  sections?: readonly DeskSectionDef[]
} = {}) {
  return (
    <>
      <PublicGlobalNav current="/media" />
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

          <MediaMastheadRail sections={sections} />
        </div>
      </header>
    </>
  )
}
