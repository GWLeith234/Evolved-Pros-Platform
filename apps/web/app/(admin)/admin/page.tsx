import type { Metadata } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import Link from 'next/link'
import {
  AdminChip,
  AdminMetricCard,
  AdminMetricRow,
  AdminPageHeader,
  AdminTable,
  AdminTd,
  AdminTh,
} from '@/components/admin/template'
import { InviteMemberButton } from './InviteMemberButton'
import { getRevenueSnapshot } from '@/lib/stripe/revenue'
import { formatMoneyCents } from '@/lib/stripe/mrr'

export const metadata: Metadata = { title: 'Admin. Evolved Pros' }

export const dynamic = 'force-dynamic'

function fmt(n: number, prefix = ''): string {
  return `${prefix}${n.toLocaleString('en-US')}`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default async function AdminDashboardPage() {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  const now = new Date()
  const oneWeekAgo   = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString()
  const oneMonthAgo  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    allUsers,
    newThisWeek,
    recentMembers,
    revenue,
  ] = await Promise.all([
    adminClient.from('users').select('id, tier, tier_status, comp_promo_code_id, role').neq('role', 'admin'),
    adminClient.from('users').select('id', { count: 'exact', head: true })
      .neq('role', 'admin').gte('created_at', oneWeekAgo),
    adminClient.from('users')
      .select('id, full_name, display_name, email, tier, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    // SPRINT K — the month-over-month Pro delta is gone with the tile that
    // showed it. A roster delta was never a revenue delta, and the query it
    // needed is one round trip the dashboard no longer has to make.
    // SPRINT K — real money, from Stripe. Never throws; degrades to
    // available:false so "could not reach Stripe" is not rendered as "$0".
    getRevenueSnapshot(),
  ])

  const users = allUsers.data ?? []
  const activeUsers    = users.filter(u => u.tier_status === 'active' || u.tier_status === 'trial')
  const cancelledUsers = users.filter(u => u.tier_status === 'cancelled' || u.tier_status === 'expired')
  const proUsers       = users.filter(u => u.tier === 'pro' && u.tier_status === 'active')

  // The "Active Members" tile counts only tier_status in {active, trial}.
  // /admin/members deliberately renders the full non-admin roster (incl.
  // cancelled / expired) so admins can re-engage churned accounts. Labelling
  // the tile "Total Members" while filtering tier_status diverged from
  // /admin/members's count and looked like a bug to QA — relabel + sub-label
  // so the filter is explicit on screen.
  const activeMembers = activeUsers.length
  // SPRINT K — MRR is the sum of live Stripe subscriptions. It is NOT tier
  // counts × list price: of the Pro roster below, some hold comp codes and
  // some are manual grants, and none of them has ever been charged.
  const proMembers    = proUsers.length
  const totalEver     = activeUsers.length + cancelledUsers.length
  const retention     = totalEver > 0 ? Math.round(activeUsers.length / totalEver * 100) : 100

  const stats = [
    {
      label: 'Active members',
      value: fmt(activeMembers),
      hint: (newThisWeek.count ?? 0) > 0
        ? `+${newThisWeek.count} this week. Excludes cancelled / expired.`
        : 'Excludes cancelled / expired.',
    },
    {
      label: 'MRR',
      // "Stripe unavailable" and "$0" are different facts. Only say $0 when
      // Stripe actually answered and had nothing to bill.
      value: revenue.available ? formatMoneyCents(revenue.mrrCents) : 'n/a',
      hint: revenue.available
        ? `${fmt(revenue.paidCount)} paid subscription${revenue.paidCount === 1 ? '' : 's'}`
        : 'Could not reach Stripe',
    },
    {
      label: 'Retention rate',
      value: `${retention}%`,
      hint: 'Active vs total ever',
    },
    // SPRINT K — the old single "Pro members" tile read as revenue while MRR
    // said n/a. Split: one tile counts people Stripe bills, the other counts
    // paid-tier access that was granted.
    {
      label: 'Paid members',
      value: revenue.available ? fmt(revenue.paidCount) : 'n/a',
      hint: revenue.available
        ? `${fmt(revenue.paidByTier.vip)} VIP · ${fmt(revenue.paidByTier.professional)} The 99`
        : 'Could not reach Stripe',
    },
    {
      label: 'Comped & granted',
      value: fmt(revenue.compedCount),
      hint: `Paid-tier access, $0 billed. ${fmt(proMembers)} on Pro incl. comps.`,
    },
  ]

  return (
    <div className="px-4 sm:px-8 py-6 max-w-5xl">
      <AdminPageHeader
        title="Home"
        subline="Platform overview."
        primary={<InviteMemberButton />}
      />

      <AdminMetricRow columns={2}>
        {stats.map(s => (
          <AdminMetricCard key={s.label} label={s.label} value={s.value} hint={s.hint} />
        ))}
      </AdminMetricRow>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Members', href: '/admin/members', desc: 'Search, filter, view profiles' },
          { label: 'CRM', href: '/admin/crm', desc: 'Prospects board' },
          { label: 'Revenue', href: '/admin/revenue', desc: 'MRR chart and breakdown' },
        ].map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="block rounded-lg p-4 min-h-[44px] bg-[var(--admin-card)] hover:bg-[var(--admin-subtle)] border border-[color:var(--admin-border)]"
          >
            <p className="font-body font-semibold text-[14px] text-[color:var(--admin-text-strong)] mb-1">{l.label}</p>
            <p className="font-body text-[13px] text-[color:var(--admin-text-2)]">{l.desc}</p>
          </Link>
        ))}
      </div>

      <AdminTable title="Recent signups">
        <thead>
          <tr>
            {['Name', 'Email', 'Tier', 'Joined'].map(h => (
              <AdminTh key={h}>{h}</AdminTh>
            ))}
          </tr>
        </thead>
        <tbody>
          {(recentMembers.data ?? []).length === 0 ? (
            <tr>
              <AdminTd label="Name" colSpan={4}>No members yet.</AdminTd>
            </tr>
          ) : (
            (recentMembers.data ?? []).map(m => (
              <tr key={m.id}>
                <AdminTd label="Name">
                  <Link href={`/admin/members/${m.id}`} className="ep-admin-el-edit">
                    {m.full_name ?? m.display_name ?? 'n/a'}
                  </Link>
                </AdminTd>
                <AdminTd label="Email">{m.email ?? 'n/a'}</AdminTd>
                <AdminTd label="Tier">
                  {m.tier === 'community' || m.tier === 'vip' || m.tier === 'pro' ? (
                    <AdminChip tone={m.tier}>{m.tier}</AdminChip>
                  ) : (
                    'n/a'
                  )}
                </AdminTd>
                <AdminTd label="Joined">{fmtDate(m.created_at)}</AdminTd>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>
      <div className="mt-3">
        <Link href="/admin/members" className="ep-admin-el-edit">
          All members
        </Link>
      </div>
    </div>
  )
}

