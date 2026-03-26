import { createClient } from '@/lib/supabase/server'
import { BrandingPortalClient } from './BrandingPortalClient'

export const dynamic = 'force-dynamic'

export default async function AdminBrandingPage() {
  const supabase = createClient()

  const [{ data: settings }, { data: ads }, { data: banners }] = await Promise.all([
    supabase.from('platform_settings').select('key, value'),
    supabase
      .from('platform_ads')
      .select('id, placement, image_url, headline, cta_text, link_url, sort_order, is_active')
      .order('sort_order'),
    supabase
      .from('profile_banners')
      .select('id, pillar, title, image_url, sort_order, is_active')
      .order('sort_order'),
  ])

  const settingsMap: Record<string, string> = {}
  for (const s of settings ?? []) {
    if (s.key && s.value !== null) settingsMap[s.key] = s.value ?? ''
  }

  return (
    <BrandingPortalClient
      initialSettings={settingsMap}
      initialAds={ads ?? []}
      initialBanners={banners ?? []}
    />
  )
}
