export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { AdsManager } from './AdsManager'

export default async function AdminAdsPage() {
  const supabase = createClient()

  const { data: rows } = await supabase
    .from('platform_ads')
    .select('id, zone, sponsor_name, ad_type, image_url, click_url, headline, start_date, end_date, is_active, sort_order, created_at')
    .order('zone')
    .order('sort_order')

  const ads = rows ?? []

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[#112535]">Ads</h1>
        <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
          {ads.length} total · {ads.filter(a => a.is_active).length} active · 4 IAB zones
        </p>
      </div>

      <AdsManager initialAds={ads} />
    </div>
  )
}
