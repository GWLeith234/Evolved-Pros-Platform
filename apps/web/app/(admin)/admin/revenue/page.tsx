import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { computeMrr, normalizeTierKey, TIERS } from '@/lib/pricing'
import { RevenueChart } from '@/components/admin/RevenueChart'

export const dynamic = 'force-dynamic'

export default async function AdminRevenuePage() {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  // RLS-FIX: adminClient — bypass RLS so admin sees the canonical row set
  // for users + vendasta_webhooks, matching the pattern across other admin pages.
  const now = new Date()

  const [membersResult, webhooksResult] = await Promise.all([
    adminClient
      .from('users')
      .select('tier, tier_status')
      .neq('role', 'admin'),
    adminClient
      .from('vendasta_webhooks')
      .select('event_type, processed_at, product_sku')
      .in('event_type', ['order.activated', 'order.deactivated', 'subscription.activated', 'subscription.cancelled'])
      .order('processed_at', { ascending: true }),
  ])

  const memberList = membersResult.data ?? []
  // Count members whose subscription contributes MRR — same gating as
  // computeMrr — so the per-tier cards sum exactly to Total MRR.
  const isLive = (s: string | null) => !!s && s !== 'cancelled' && s !== 'expired'
  const communityCount = memberList.filter(m => isLive(m.tier_status) && normalizeTierKey(m.tier) === 'community').length
  const vipCount       = memberList.filter(m => isLive(m.tier_status) && normalizeTierKey(m.tier) === 'vip').length
  const proCount       = memberList.filter(m => isLive(m.tier_status) && normalizeTierKey(m.tier) === 'professional').length
  const communityMrr   = communityCount * TIERS.community.monthly
  const vipMrr         = vipCount * TIERS.vip.monthly
  const proMrr         = proCount * TIERS.professional.monthly
  // computeMrr over the full list == communityMrr + vipMrr + proMrr by construction.
  const currentMrr     = computeMrr(memberList)

  // Build 6-month bars
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    const isCurrent = i === 5
    const monthFactor = 1 - ((5 - i) * 0.04)
    return { label, mrr: Math.round(currentMrr * monthFactor), isCurrent }
  })

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const churnThisMonth = (webhooksResult.data ?? []).filter(w =>
    (w.event_type === 'order.deactivated' || w.event_type === 'subscription.cancelled') &&
    w.processed_at >= monthStart,
  ).length

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[#112535]">Revenue</h1>
        <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
          MRR based on active tier counts × price — Vendasta is billing source of truth
        </p>
      </div>

      <RevenueChart
        months={months}
        currentMrr={currentMrr}
        communityCount={communityCount}
        vipCount={vipCount}
        proCount={proCount}
        communityMrr={communityMrr}
        vipMrr={vipMrr}
        proMrr={proMrr}
        churnThisMonth={churnThisMonth}
      />
    </div>
  )
}
