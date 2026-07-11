'use client'

// Client fallback for surfaces that cannot server-fetch platform_ads
// (e.g. community right rail). /home should prefer the SSR path via
// HomeSponsorAd / HomeSponsorRow with preloaded ads.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
        q.eq('is_active', true).order('sort_order').limit(1).maybeSingle()
      const primary = await tryQuery(
        sb.from('platform_ads').select(SPONSOR_AD_COLUMNS).in('placement', ['sidebar', 'all']),
      )
      if (cancelled) return
      if (primary.data) {
        setAd(primary.data as SponsorAd)
        return
      }
      const fallback = await tryQuery(sb.from('platform_ads').select(SPONSOR_AD_COLUMNS))
      if (!cancelled && fallback.data) setAd(fallback.data as SponsorAd)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return <HomeSponsorAd ad={ad} />
}
