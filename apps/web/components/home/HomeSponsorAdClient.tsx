'use client'

// Client fallback for surfaces that cannot server-fetch platform_ads
// (e.g. community right rail). /home should prefer the SSR path via
// HomeSponsorAd / HomeSponsorRow with preloaded ads.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { filterLiveAds } from '@/lib/ads/iab'
import {
  HomeSponsorAd,
  SPONSOR_AD_COLUMNS,
  type SponsorAd,
} from './HomeSponsorAd'

export function HomeSponsorAdClient() {
  const [ad, setAd] = useState<SponsorAd | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    void (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const tryQuery = (q: any) =>
        q.eq('is_active', true).order('sort_order').limit(8)
      const primary = await tryQuery(
        sb.from('platform_ads').select(SPONSOR_AD_COLUMNS).in('placement', ['sidebar', 'all', 'platform', 'topnav']),
      )
      if (cancelled) return
      const live = filterLiveAds((primary.data ?? []) as SponsorAd[])
      if (live[0]) {
        setAd(live[0])
        return
      }
      const fallback = await tryQuery(sb.from('platform_ads').select(SPONSOR_AD_COLUMNS))
      if (!cancelled) {
        const next = filterLiveAds((fallback.data ?? []) as SponsorAd[])
        if (next[0]) setAd(next[0])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return <HomeSponsorAd ad={ad} />
}
