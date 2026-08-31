'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAcademyAd } from '@/lib/sponsors/partners'
import { IAB_ZONE_TO_SLOT, inferHouseAdSlot } from '@/lib/ads/house'
import { HouseAdTracker } from '@/components/ads/HouseAdTracker'

type Zone = 'A' | 'B' | 'C' | 'D' | 'E'

interface Ad {
  id: string
  image_url: string | null
  click_url: string | null
  link_url: string | null
  headline: string | null
  sponsor_name: string | null
  tool_name: string | null
}

interface MediaAdZoneProps {
  zone: Zone
}

const IAB_PX: Partial<Record<Zone, { w: number; h: number }>> = {
  A: { w: 300, h: 250 },
  C: { w: 728, h: 90 },
  E: { w: 300, h: 600 },
}

export function MediaAdZone({ zone }: MediaAdZoneProps) {
  const [ad, setAd] = useState<Ad | null>(null)

  useEffect(() => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('platform_ads')
      .select('id, image_url, click_url, link_url, headline, sponsor_name, tool_name')
      .eq('zone', zone)
      .eq('is_active', true)
      .contains('placements', ['media'])
      .order('sort_order')
      .limit(1)
      .maybeSingle()
      .then(({ data }: { data: Ad | null }) => {
        if (data) setAd(data)
      })
  }, [zone])

  if (!ad || !ad.image_url) return null

  const house = isAcademyAd(ad)
  const slot = IAB_ZONE_TO_SLOT[zone] ?? inferHouseAdSlot({ ...ad, zone })
  const size = IAB_PX[zone]

  const inner = (
    <>
      {!house && (
        <p
          style={{
            fontFamily: 'sans-serif',
            fontSize: '12px',
            color: 'rgba(10,15,24,0.35)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px',
          }}
        >
          Advertisement
        </p>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ad.image_url}
        alt={ad.headline ?? ad.sponsor_name ?? 'Ad'}
        width={size?.w}
        height={size?.h}
        style={{
          width: size ? size.w : '100%',
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '4px',
          display: 'block',
        }}
      />
    </>
  )

  if (house) {
    return (
      <div data-ad-zone={zone} style={{ marginBottom: '14px' }}>
        <HouseAdTracker
          ad={ad}
          slot={slot}
          locationId={`media-zone-${zone}`}
          style={{ textDecoration: 'none', display: 'block' }}
          ariaLabel={`${ad.headline ?? 'Evolved Pros Academy'} — Evolved Pros Academy`}
        >
          {inner}
        </HouseAdTracker>
      </div>
    )
  }

  if (ad.click_url) {
    return (
      <div data-ad-zone={zone} style={{ marginBottom: '14px' }}>
        <a href={ad.click_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          {inner}
        </a>
      </div>
    )
  }

  return (
    <div data-ad-zone={zone} style={{ marginBottom: '14px' }}>
      {inner}
    </div>
  )
}
