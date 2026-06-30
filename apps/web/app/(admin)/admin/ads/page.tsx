export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { AdsManager } from './AdsManager'

export default async function AdminAdsPage() {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  // RLS-FIX: adminClient — Members can read active platform_ads policy
  // filters is_active=true, so admins on the SSR client wouldn't see
  // disabled/expired ads they need to manage.
  const { data: rows } = await adminClient
    .from('platform_ads')
    .select('id, zone, sponsor_name, ad_type, image_url, click_url, headline, body_copy, cta_text, start_date, end_date, is_active, sort_order, created_at')
    .order('zone')
    .order('sort_order')

  const ads = rows ?? []

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[#112535]">Ads</h1>
        {/* Count is rendered inside AdsManager so it stays live after create/delete */}
      </div>

      <AdsManager initialAds={ads} />
    </div>
  )
}
