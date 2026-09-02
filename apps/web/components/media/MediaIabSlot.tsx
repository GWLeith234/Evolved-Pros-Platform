'use client'

import type { CSSProperties } from 'react'
import { IabAdvertisementSlot } from '@/components/ads/IabImageAd'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

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
