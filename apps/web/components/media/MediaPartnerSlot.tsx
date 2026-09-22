/**
 * SooToday / Toronto Today slot geometry, EP / partner inventory only.
 * Never loads an open ad network. Creative is EP or partner inventory only.
 *
 * SPRINT M - AN UNFILLED SLOT RENDERS NOTHING.
 *
 * This file used to draw a dashed box reading "PARTNER STORY - Evolved Pros
 * Media partner inventory" over a blank grey thumbnail whenever no partner had
 * bought the placement. That is a rate card printed on a reader's page: it
 * tells them nothing, it occupies the space a story could have had, and at a
 * glance it reads like a broken article card. Held geometry is worth having
 * when a slot is about to fill on the same paint; it is not worth having when
 * the slot is empty for a week.
 *
 * The filled path goes through MediaIabSlot -> IabAdvertisementSlot -> AdPlane,
 * so every partner unit that does render inherits the separation standard.
 */
import { MediaIabSlot } from '@/components/media/MediaIabSlot'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

export type PartnerSlotKind =
  | 'leaderboard'
  | 'mid-fluid'
  | 'mid-rect'
  | 'rail'
  | 'rail-half'
  | 'sponsored-row'
  | 'article-inline'

export function MediaPartnerSlot({
  kind,
  ad,
  locationId,
}: {
  kind: PartnerSlotKind
  ad?: SponsorAd | null
  locationId: string
}) {
  // No partner, no unit. The geometry wrappers collapse via the :empty rules
  // in globals.css, so the surrounding rhythm closes up rather than leaving a
  // hole where the empty-state box used to be.
  if (!ad?.image_url) return null

  return (
    <div
      className={kind === 'mid-fluid' ? 'ep-media-partner-mid-fluid' : undefined}
      data-media-partner-slot={kind}
      data-media-partner-filled="true"
    >
      <MediaIabSlot ad={ad} locationId={locationId} />
    </div>
  )
}

/** Centered 300x250 scroll avail. House/partner creative only, or nothing. */
export function MediaScrollRect({
  ad,
  locationId,
}: {
  ad?: SponsorAd | null
  locationId: string
}) {
  if (!ad?.image_url) return null
  return (
    <div className="ep-media-mid-rect" data-media-scroll-rect="300x250">
      <MediaPartnerSlot kind="mid-rect" ad={ad} locationId={locationId} />
    </div>
  )
}
