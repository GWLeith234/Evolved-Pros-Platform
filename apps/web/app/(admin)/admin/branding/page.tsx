import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { BrandingPortalClient } from './BrandingPortalClient'

export const dynamic = 'force-dynamic'

export default async function AdminBrandingPage() {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  // RLS-FIX: adminClient — platform_ads filters is_active=true for non-admins,
  // and banner/settings reads are admin-managed; bypass RLS for consistency.
  const [{ data: settings }, { data: ads }, { data: banners }] = await Promise.all([
    adminClient.from('platform_settings').select('key, value'),
    adminClient
      .from('platform_ads')
      .select('id, placement, image_url, headline, tool_name, endorsement_quote, special_offer, cta_text, link_url, sort_order, is_active')
      .order('sort_order'),
    adminClient
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
