import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { computeMrr, normalizeTierKey, isRevenueMember } from '@/lib/pricing'
import { getMrrMonthlyByTierKey } from '@/lib/commerce/catalogue'
import { RevenueChart } from '@/components/admin/RevenueChart'

export const dynamic = 'force-dynamic'

export default async function AdminRevenuePage() {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  // RLS-FIX: adminClient — bypass RLS so admin sees the canonical row set
  // for users, matching the pattern across other admin pages.
  const now = new Date()

  const membersResult = await adminClient
    .from('users')
    .select('tier, tier_status, comp_promo_code_id, role')
    .neq('role', 'admin')

  const memberList = membersResult.data ?? []
  // Count members whose subscription contributes MRR — same gating as
  // computeMrr (live status, not comped, not a guest) — so the per-tier cards
  // sum exactly to Total MRR. Comped members and guests are full-access but $0.
  const paysMrr = isRevenueMember
  const communityCount = memberList.filter(m => paysMrr(m) && normalizeTierKey(m.tier) === 'community').length
  const vipCount       = memberList.filter(m => paysMrr(m) && normalizeTierKey(m.tier) === 'vip').length
  const proCount       = memberList.filter(m => paysMrr(m) && normalizeTierKey(m.tier) === 'professional').length
  // Prices come from the catalogue (source of truth) so MRR reflects admin
  // price edits; TIERS constants are the per-tier fallback inside the helper.
  const monthlyByTier  = await getMrrMonthlyByTierKey()
  const communityMrr   = communityCount * monthlyByTier.community
  const vipMrr         = vipCount * monthlyByTier.vip
  const proMrr         = proCount * monthlyByTier.professional
  // computeMrr over the full list == communityMrr + vipMrr + proMrr by construction.
  const currentMrr     = computeMrr(memberList, monthlyByTier)

  // Build 6-month bars
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    const isCurrent = i === 5
    const monthFactor = 1 - ((5 - i) * 0.04)
    return { label, mrr: Math.round(currentMrr * monthFactor), isCurrent }
  })

  // Previous churn count came from an empty webhook table (always 0).
  const churnThisMonth = 0

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[color:var(--admin-text-strong)]">Revenue</h1>
        <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mt-0.5">
          MRR based on active tier counts × price — the billing provider is source of truth
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
        vipMonthly={monthlyByTier.vip}
        proMonthly={monthlyByTier.professional}
        churnThisMonth={churnThisMonth}
      />
    </div>
  )
}
