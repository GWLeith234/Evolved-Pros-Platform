import { headers } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { getCatalogue } from '@/lib/commerce/catalogue'
import { stripeConfigured } from '@/lib/stripe/config'
import { ProductsAdminClient } from '@/components/admin/ProductsAdminClient'

export const dynamic = 'force-dynamic'

// SPRINT I Phase 2 — reads our own products/prices catalogue (source of truth).
export default async function AdminProductsPage() {
  const h = headers()
  if (h.get('Next-Router-Prefetch') === '1') return null

  const [products, { data: members }] = await Promise.all([
    getCatalogue(),
    adminClient
      .from('users')
      .select('tier, tier_status')
      .neq('role', 'admin')
      .in('tier_status', ['active', 'trial']),
  ])

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
        stripeConfigured={stripeConfigured()}
      />
    </div>
  )
}
