import { headers } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import {
  PRODUCT_SETTING_KEYS,
  buildMembershipProducts,
} from '@/lib/admin/products'
import { ProductsAdminClient } from '@/components/admin/ProductsAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const h = headers()
  if (h.get('Next-Router-Prefetch') === '1') return null

  const keys = Object.values(PRODUCT_SETTING_KEYS)
  const [{ data: settingsRows }, { data: members }] = await Promise.all([
    adminClient.from('platform_settings').select('key, value').in('key', keys),
    adminClient
      .from('users')
      .select('tier, tier_status')
      .neq('role', 'admin')
      .in('tier_status', ['active', 'trial']),
  ])

  const settings: Record<string, string> = {}
  for (const row of settingsRows ?? []) {
    if (row.key && row.value != null) settings[row.key] = String(row.value)
  }

  const products = buildMembershipProducts(settings)
  const memberCounts: Record<string, number> = { community: 0, vip: 0, pro: 0, other: 0 }
  for (const m of members ?? []) {
    const t = (m.tier ?? '').toLowerCase()
    if (t === 'community' || t === 'vip' || t === 'pro') memberCounts[t]++
    else memberCounts.other++
  }

  return (
    <div className="px-4 sm:px-8 py-6">
      <ProductsAdminClient
        initialProducts={products}
        memberCounts={memberCounts}
        initialSettings={settings}
        vendastaCrm="https://business.vendasta.com/crm/contacts"
        vendastaMarketplace="https://business.vendasta.com/marketplace"
      />
    </div>
  )
}
