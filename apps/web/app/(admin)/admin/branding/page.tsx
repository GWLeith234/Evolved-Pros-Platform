import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { BrandingPortalClient } from './BrandingPortalClient'

export const dynamic = 'force-dynamic'

export default async function AdminBrandingPage() {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  // RLS-FIX: adminClient — banner/settings reads are admin-managed; bypass RLS
  // for consistency. Ad management now lives entirely under /admin/ads.
  const [{ data: settings }, { data: banners }] = await Promise.all([
    adminClient.from('platform_settings').select('key, value'),
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
      initialBanners={banners ?? []}
    />
  )
}
