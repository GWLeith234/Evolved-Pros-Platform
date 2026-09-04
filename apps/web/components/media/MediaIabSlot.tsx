'use client'

import type { CSSProperties } from 'react'
import { IabAdvertisementSlot } from '@/components/ads/IabImageAd'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

/** Centered paper IAB used between story / job / event rows. */
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
        padding: '12px 0',
      }}
    >
      <MediaIabSlot ad={ad} locationId={locationId} />
    </div>
  )
}

/** Paper-tone IAB unit for the Media magazine feed. Label sits on the unit. */
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
      tone="paper"
      style={style}
    />
  )
}
