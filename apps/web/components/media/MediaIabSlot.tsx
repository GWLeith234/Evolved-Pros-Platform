'use client'

import type { CSSProperties } from 'react'
import { IabAdvertisementSlot } from '@/components/ads/IabImageAd'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

/**
 * SPRINT M - these two used to pass tone="paper" so the label could be tinted
 * to match the cream article page. That is exactly backwards: matching the page
 * is what made the unit disappear into it. The AdPlane inside
 * IabAdvertisementSlot now steps away from whatever page it sits on, in both
 * themes, so there is no tone to pass.
 */

/** Centered IAB used between story / job / event rows. */
export function MediaCenteredAd({
  ad,
  locationId,
}: {
  ad: SponsorAd
  locationId: string
}) {
  if (!ad.image_url) return null
  return (
    <div
      data-media-ads="scroll-banner"
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        paddingBlock: 'var(--space-ad-lean)',
      }}
    >
      <MediaIabSlot ad={ad} locationId={locationId} />
    </div>
  )
}

/** IAB unit for the Media magazine feed. The plane carries the label. */
export function MediaIabSlot({
  ad,
  locationId,
  style,
}: {
  ad: SponsorAd
  locationId: string
  style?: CSSProperties
}) {
  if (!ad.image_url) return null
  return (
    <IabAdvertisementSlot
      ad={{ ...ad, image_url: ad.image_url }}
      locationId={locationId}
      style={style}
    />
  )
}
