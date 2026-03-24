import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAdminApi, getTierMrr } from '@/lib/admin/helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  const supabase = createClient()

  const now = new Date()
  const oneWeekAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString()
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()

  const [allMembers, newThisWeek, cancelledCount, proLastMonth, allLastMonth] = await Promise.all([
    supabase.from('users').select('id, tier, tier_status').neq('role', 'admin'),
    supabase.from('users').select('id', { count: 'exact', head: true })
      .neq('role', 'admin')
      .gte('created_at', oneWeekAgo),
    supabase.from('users').select('id', { count: 'exact', head: true })
      .eq('tier_status', 'cancelled'),
    supabase.from('users').select('id', { count: 'exact', head: true })
      .eq('tier', 'pro')
      .gte('created_at', twoMonthsAgo)
      .lte('created_at', oneMonthAgo),
    supabase.from('users').select('id', { count: 'exact', head: true })
      .neq('role', 'admin')
      .lte('created_at', oneMonthAgo),
  ])

  const members = allMembers.data ?? []
  const activeMembers = members.filter(m => m.tier_status === 'active' || m.tier_status === 'trial')
  const proMembers    = members.filter(m => m.tier === 'pro' && m.tier_status === 'active')

  const mrr         = members.reduce((sum, m) => sum + getTierMrr(m.tier, m.tier_status), 0)
  const totalCount  = members.length
  const cancelled   = cancelledCount.count ?? 0
  const retentionRate = totalCount > 0
    ? Math.round((totalCount - cancelled) / totalCount * 100)
    : 100

  // MRR delta: estimate by comparing current pro count vs last month's pro count
  const currentProCount  = proMembers.length
  const lastMonthProCount = proLastMonth.count ?? 0
  const mrrDelta = (currentProCount - lastMonthProCount) * 79

  // Pro members delta
  const proMembersDelta = currentProCount - (proLastMonth.count ?? 0)

  // New members this week delta vs previous week
  const newMembersThisWeek = newThisWeek.count ?? 0

  return NextResponse.json({
    totalMembers:       activeMembers.length,
    newMembersThisWeek,
    mrr,
    mrrDelta,
    retentionRate,
    proMembers:        currentProCount,
    proMembersDelta,
  })
}
