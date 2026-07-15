'use client'

import { useState } from 'react'
import { AdsManager } from './AdsManager'
import { PlacementAdsManager } from './PlacementAdsManager'

// Zone-model ad shape (IAB banner zones A–D), passed straight to AdsManager.
interface ZoneAd {
  id: string
  zone: string | null
  sponsor_name: string | null
  ad_type: string | null
  image_url: string | null
  click_url: string | null
  headline: string | null
  body_copy: string | null
  cta_text: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  sort_order: number
}

// Placement-model ad shape (sidebar / endorsement), passed to PlacementAdsManager.
interface PlacementAd {
  id: string
  placement: string
  image_url: string | null
  headline: string | null
  tool_name: string | null
  endorsement_quote: string | null
  special_offer: string | null
  cta_text: string | null
  link_url: string | null
  sort_order: number
  is_active: boolean
}

type AdsSection = 'zones' | 'placements'

const SECTIONS: { key: AdsSection; label: string; blurb: string }[] = [
  { key: 'zones', label: 'Banner Zones (A/B/C)', blurb: 'IAB display zones — sidebar rectangle, native in-feed, leaderboard, and pre-roll video.' },
  { key: 'placements', label: 'Sidebar / Endorsement Placements', blurb: 'Sponsor cards with George’s endorsement — home sidebar, home row, community, academy, and events.' },
]

export function AdsTabsShell({
  zoneAds,
  placementAds,
  settings,
}: {
  zoneAds: ZoneAd[]
  placementAds: PlacementAd[]
  settings: Record<string, string>
}) {
  const [section, setSection] = useState<AdsSection>('zones')

  const activeBlurb = SECTIONS.find(s => s.key === section)?.blurb ?? ''

  return (
    <div>
      {/* Section tabs */}
      <div className="flex gap-0 mb-2 border-b" style={{ borderColor: 'rgba(27,60,90,0.12)' }}>
        {SECTIONS.map(s => {
          const active = section === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setSection(s.key)}
              className="px-5 py-3 font-condensed font-bold uppercase tracking-wider text-[12px] border-b-2 -mb-px transition-colors"
              style={{
                color: active ? '#68a2b9' : '#7a8a96',
                borderColor: active ? '#68a2b9' : 'transparent',
                background: 'none',
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          )
        })}
      </div>
      <p className="font-body text-[13px] mb-6" style={{ color: 'var(--admin-text-2)' }}>
        {activeBlurb}
      </p>

      {section === 'zones' && <AdsManager initialAds={zoneAds} />}
      {section === 'placements' && (
        <PlacementAdsManager initialAds={placementAds} settings={settings} />
      )}
    </div>
  )
}
