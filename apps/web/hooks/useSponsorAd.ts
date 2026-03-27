'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type SponsorAd = {
  id: string
  image_url: string | null
  headline: string | null
  tool_name: string | null
  endorsement_quote: string | null
  special_offer: string | null
  cta_text: string | null
  link_url: string | null
}

export function useSponsorAd(placement: 'academy' | 'community' | 'events') {
  const [ad, setAd] = useState<SponsorAd | null>(null)
  const [ads, setAds] = useState<SponsorAd[]>([])
  const [idx, setIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase
        .from('platform_ads')
        .select('id, image_url, headline, tool_name, endorsement_quote, special_offer, cta_text, link_url')
        .in('placement', [placement, 'all'])
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'ad_sidebar_interval')
        .single(),
    ]).then(([adsResult, intervalResult]) => {
      const list = adsResult.data ?? []
      if (!list.length) return
      setAds(list)
      setAd(list[0])
      const secs = parseInt(intervalResult.data?.value ?? '10', 10)
      const ms = (isNaN(secs) ? 10 : secs) * 1000
      if (list.length > 1) {
        timerRef.current = setInterval(() => {
          setIdx(i => {
            const next = (i + 1) % list.length
            setAd(list[next])
            return next
          })
        }, ms)
      }
    })
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [placement])

  // suppress unused variable warning — idx is used internally by the setIdx callback
  void idx
  void ads

  return ad
}
