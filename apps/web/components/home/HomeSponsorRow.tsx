'use client'

// Two-up sponsor row below the 4-up tile grid on /home. Renders through the
// shared SponsorAdCard so the row, the sidebar placement, and the CTA/accent
// rules are all single-source (A6.2). The row shows DIFFERENT ads (de-duped by
// id) — never the same ad twice. Mount-gated so SSR + first hydration agree.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  HomeSponsorAd,
  SponsorAdCard,
  SponsoredEyebrow,
  SPONSOR_AD_COLUMNS,
  type SponsorAd,
} from './HomeSponsorAd'

export function HomeSponsorRow() {
  const [mounted, setMounted] = useState(false)
  const [ads, setAds] = useState<SponsorAd[]>([])

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    void (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const primary = await sb
        .from('platform_ads')
        .select(SPONSOR_AD_COLUMNS)
        .eq('is_active', true)
        .in('placement', ['home', 'all'])
        .order('sort_order')
        .limit(2)
      const rows = (primary.data ?? []) as SponsorAd[]
      if (rows.length < 2) {
        const fallback = await sb
          .from('platform_ads')
          .select(SPONSOR_AD_COLUMNS)
          .eq('is_active', true)
          .order('sort_order')
          .limit(2)
        const seen = new Set(rows.map(r => r.id))
        for (const r of (fallback.data ?? []) as SponsorAd[]) {
          if (rows.length >= 2) break
          if (!seen.has(r.id)) rows.push(r) // distinct ads only — never the same ad twice
        }
      }
      setAds(rows.slice(0, 2))
    })()
  }, [])

  if (!mounted || ads.length === 0) return null

  // Single placement available → render one card, not the same ad duplicated.
  if (ads.length === 1) {
    return (
      <section aria-label="Sponsored">
        <SponsoredEyebrow />
        <div style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }}>
          <SponsorAdCard ad={ads[0]} />
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Sponsored">
      <SponsoredEyebrow />
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        style={{ width: '100%', maxWidth: 1440, margin: '0 auto', paddingTop: 4 }}
      >
        {ads.map(ad => (
          <SponsorAdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </section>
  )
}

// Re-export so existing imports of the sidebar placement keep working.
export { HomeSponsorAd }
