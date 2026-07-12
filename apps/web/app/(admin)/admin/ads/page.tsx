export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { AdsTabsShell } from './AdsTabsShell'

export default async function AdminAdsPage() {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  // RLS-FIX: adminClient — the "Members can read active platform_ads" policy
  // filters is_active=true, so admins on the SSR client wouldn't see
  // disabled/expired ads they need to manage. Both ad models live in the one
  // platform_ads table, so we read the union of columns each editor needs.
  const [{ data: zoneRows }, { data: placementRows }, { data: settings }] = await Promise.all([
    adminClient
      .from('platform_ads')
      .select('id, zone, sponsor_name, ad_type, image_url, click_url, headline, body_copy, cta_text, start_date, end_date, is_active, sort_order, created_at')
      .order('zone')
      .order('sort_order'),
    adminClient
      .from('platform_ads')
      .select('id, placement, image_url, headline, tool_name, endorsement_quote, special_offer, cta_text, link_url, sort_order, is_active')
      .order('sort_order'),
    adminClient.from('platform_settings').select('key, value'),
  ])

  const settingsMap: Record<string, string> = {}
  for (const s of settings ?? []) {
    if (s.key && s.value !== null) settingsMap[s.key] = s.value ?? ''
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-1" style={{ color: '#68a2b9' }}>
          Platform
        </p>
        <h1 className="font-display font-black text-[28px] text-[#112535]">Ads</h1>
        <p className="font-body text-[14px] mt-1" style={{ color: '#7a8a96' }}>
          Manage every sponsored placement across the platform, from IAB banner zones to endorsement cards.
        </p>
      </div>

      <AdsTabsShell
        zoneAds={zoneRows ?? []}
        placementAds={placementRows ?? []}
        settings={settingsMap}
      />
    </div>
  )
}
