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
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()

  const [
    allUsers,
    newThisWeek,
    recentMembers,
    proLastMonth,
  ] = await Promise.all([
    adminClient.from('users').select('id, tier, tier_status, comp_promo_code_id, role').neq('role', 'admin'),
    adminClient.from('users').select('id', { count: 'exact', head: true })
      .neq('role', 'admin').gte('created_at', oneWeekAgo),
    adminClient.from('users')
      .select('id, full_name, display_name, email, tier, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    // Pro members created last month for the delta. Exclude comped guests
    // (role='guest' / tier_status='comp'): they hold Pro access but are not
    // revenue, so they must not inflate the paying-Pro baseline.
    adminClient.from('users').select('id', { count: 'exact', head: true })
      .eq('tier', 'pro').neq('role', 'guest').neq('tier_status', 'comp')
      .gte('created_at', twoMonthsAgo).lte('created_at', oneMonthAgo),
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
  // MRR stays empty until VENDASTA-4 wires billing_events. Do not invent
  // it from tier counts × list price (same rule as /admin/revenue).
  const proMembers    = proUsers.length
  const proLastMo     = proLastMonth.count ?? 0
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
      value: 'n/a',
      hint: 'Billing not connected',
    },
    {
      label: 'Retention rate',
      value: `${retention}%`,
      hint: 'Active vs total ever',
    },
    {
      label: 'Pro members',
      value: fmt(proMembers),
      hint: `${proMembers - proLastMo >= 0 ? '+' : ''}${proMembers - proLastMo} vs last month`,
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

