import type { Metadata } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import Link from 'next/link'
import { InviteMemberButton } from './InviteMemberButton'

export const metadata: Metadata = { title: 'Admin — Evolved Pros' }

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
    postsCount,
    episodesCount,
  ] = await Promise.all([
    adminClient.from('users').select('id, tier, tier_status, comp_promo_code_id, role').neq('role', 'admin'),
    adminClient.from('users').select('id', { count: 'exact', head: true })
      .neq('role', 'admin').gte('created_at', oneWeekAgo),
    adminClient.from('users')
      .select('id, full_name, display_name, email, tier, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    // Pro members created last month for the delta — exclude comped guests
    // (role='guest' / tier_status='comp'): they hold Pro access but are not
    // revenue, so they must not inflate the paying-Pro baseline.
    adminClient.from('users').select('id', { count: 'exact', head: true })
      .eq('tier', 'pro').neq('role', 'guest').neq('tier_status', 'comp')
      .gte('created_at', twoMonthsAgo).lte('created_at', oneMonthAgo),
    // Total posts across the platform — no status filter, the count is the
    // raw signal (admins will look at the community page for breakdowns).
    adminClient.from('posts').select('id', { count: 'exact', head: true }),
    // Published episodes only — drafts shouldn't count toward the public catalog tile.
    adminClient.from('episodes').select('id', { count: 'exact', head: true }).eq('is_published', true),
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
  const totalPosts    = postsCount.count ?? 0
  const publishedEpisodes = episodesCount.count ?? 0

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
    {
      label: 'Total posts',
      value: fmt(totalPosts),
      hint: 'Community feed',
    },
    {
      label: 'Published episodes',
      value: fmt(publishedEpisodes),
      hint: 'Live podcast catalog',
    },
  ]

  return (
    <div className="px-4 sm:px-8 py-6 max-w-5xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-condensed font-bold text-[28px] text-[color:var(--admin-text-strong)]">Home</h1>
          <p className="font-body text-[14px] text-[color:var(--admin-text-2)] mt-0.5" suppressHydrationWarning>
            Platform overview, {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <InviteMemberButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {stats.map(s => (
          <div
            key={s.label}
            className="rounded-lg p-4"
            style={{ backgroundColor: 'var(--admin-card)', border: '1px solid var(--admin-border)' }}
          >
            <p className="font-body text-[13px] mb-1" style={{ color: 'var(--admin-text-2)' }}>
              {s.label}
            </p>
            <p className="font-condensed font-bold text-[28px] leading-none mb-1" style={{ color: 'var(--admin-text-strong)' }}>
              {s.value}
            </p>
            <p className="font-body text-[12px]" style={{ color: 'var(--admin-text-2)' }}>
              {s.hint}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Members', href: '/admin/members', desc: 'Search, filter, view profiles' },
          { label: 'Member upgrades', href: '/admin/pipeline', desc: 'See who is ready to upgrade' },
          { label: 'Revenue', href: '/admin/revenue', desc: 'MRR chart and breakdown' },
        ].map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="block rounded-lg p-4 min-h-[44px] bg-[var(--admin-card)] hover:bg-[#eef1f4] border border-[color:var(--admin-border)]"
          >
            <p className="font-body font-semibold text-[14px] text-[color:var(--admin-text-strong)] mb-1">{l.label}</p>
            <p className="font-body text-[13px] text-[color:var(--admin-text-2)]">{l.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent signups */}
      <div className="rounded-lg overflow-x-auto mb-6" style={{ backgroundColor: 'var(--admin-card)', border: '1px solid rgba(27,60,90,0.1)' }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}>
          <p className="font-body font-semibold text-[13px] text-[color:var(--admin-text-strong)]">Recent signups</p>
          <Link href="/admin/members" className="font-body text-[13px] text-[color:var(--admin-text)] hover:underline min-h-[44px] inline-flex items-center">
            All members
          </Link>
        </div>
        {(recentMembers.data ?? []).length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)]">No members yet.</p>
          </div>
        ) : (
          <table className="w-full min-w-[520px]">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.06)' }}>
                {['Name', 'Email', 'Tier', 'Joined'].map(h => (
                  <th key={h} className="px-5 py-2 text-left font-body text-[12px] font-semibold text-[color:var(--admin-text-2)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentMembers.data ?? []).map((m, i, arr) => (
                <tr key={m.id} style={{ borderBottom: i === arr.length - 1 ? 'none' : '1px solid rgba(27,60,90,0.06)' }}>
                  <td className="px-5 py-3">
                    <Link href={`/admin/members/${m.id}`} className="font-body text-[14px] text-[color:var(--admin-text)] hover:text-[#ef0e30] transition-colors">
                      {m.full_name ?? m.display_name ?? 'n/a'}
                    </Link>
                  </td>
                  <td className="px-5 py-3"><p className="font-body text-[13px] text-[color:var(--admin-text-2)]">{m.email ?? 'n/a'}</p></td>
                  <td className="px-5 py-3">
                    {m.tier ? (
                      <span className="font-condensed font-bold uppercase text-[9px] px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--admin-subtle)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}>
                        {m.tier}
                      </span>
                    ) : (
                      <span className="font-body text-[13px] text-[color:var(--admin-text-2)]">n/a</span>
                    )}
                  </td>
                  <td className="px-5 py-3"><p className="font-body text-[13px] text-[color:var(--admin-text-2)]">{fmtDate(m.created_at)}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

