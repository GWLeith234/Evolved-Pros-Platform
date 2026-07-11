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
  sponsor_name?: string | null
}

/** Shuffle in place (Fisher–Yates). */
function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Dedupe by id / name for client-fetched ads. */
function dedupeClientAds(list: SponsorAd[]): SponsorAd[] {
  const seen = new Set<string>()
  const out: SponsorAd[] = []
  for (const ad of list) {
    const k = ad.id || `${ad.sponsor_name ?? ''}|${ad.tool_name ?? ''}`.toLowerCase()
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(ad)
  }
  return out
}

/**
 * Client-side rotating sponsor for legacy placements (academy/community/events).
 * Starts at a random index and cycles; list is shuffled + deduped on load.
 */
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
        .select('id, image_url, headline, tool_name, endorsement_quote, special_offer, cta_text, link_url, sponsor_name')
        .in('placement', [placement, 'all'])
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'ad_sidebar_interval')
        .maybeSingle(),
    ]).then(([adsResult, intervalResult]) => {
      const list = shuffleInPlace(dedupeClientAds(adsResult.data ?? []))
      if (!list.length) return
      setAds(list)
      const start = Math.floor(Math.random() * list.length)
      setIdx(start)
      setAd(list[start])
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [placement])

  void idx
  void ads

  return ad
}
