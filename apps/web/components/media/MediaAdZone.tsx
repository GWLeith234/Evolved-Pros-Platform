'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Zone = 'A' | 'B' | 'C' | 'D'

interface Ad {
  id: string
  image_url: string | null
  click_url: string | null
  headline: string | null
  sponsor_name: string | null
}

interface MediaAdZoneProps {
  zone: Zone
}

export function MediaAdZone({ zone }: MediaAdZoneProps) {
  const [ad, setAd] = useState<Ad | null>(null)

  useEffect(() => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('platform_ads')
      .select('id, image_url, click_url, headline, sponsor_name')
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

  const inner = (
    <>
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ad.image_url}
        alt={ad.headline ?? ad.sponsor_name ?? 'Ad'}
        style={{
          width: '100%',
          borderRadius: '4px',
          display: 'block',
        }}
      />
    </>
  )

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
