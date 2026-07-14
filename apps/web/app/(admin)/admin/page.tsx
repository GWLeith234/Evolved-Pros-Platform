import type { Metadata } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import Link from 'next/link'
import { computeMrr } from '@/lib/pricing'
import { InviteMemberButton } from './InviteMemberButton'

export const metadata: Metadata = { title: 'Admin — Evolved Pros' }

export const dynamic = 'force-dynamic'

function fmt(n: number, prefix = ''): string {
  return `${prefix}${n.toLocaleString('en-US')}`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  success: { bg: 'rgba(34,197,94,0.1)',   color: '#16a34a' },
  error:   { bg: 'rgba(239,14,48,0.1)',    color: '#ef0e30' },
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
    adminClient.from('users').select('id, tier, tier_status, comp_promo_code_id').neq('role', 'admin'),
    adminClient.from('users').select('id', { count: 'exact', head: true })
      .neq('role', 'admin').gte('created_at', oneWeekAgo),
    adminClient.from('users')
      .select('id, full_name, display_name, email, tier, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient.from('users').select('id', { count: 'exact', head: true })
      .eq('tier', 'pro').gte('created_at', twoMonthsAgo).lte('created_at', oneMonthAgo),
    // Total posts across the platform — no status filter, the count is the
    // raw signal (admins will look at the community page for breakdowns).
    adminClient.from('posts').select('id', { count: 'exact', head: true }),
    // Published episodes only — drafts shouldn't count toward the public catalog tile.
    adminClient.from('episodes').select('id', { count: 'exact', head: true }).eq('is_published', true),
  ])

  // vendasta_webhooks may not exist in all environments — fetch separately so it can't crash the page
  const recentWebhooks = await adminClient
    .from('vendasta_webhooks')
    .select('id, event_type, vendasta_contact_id, product_sku, processed_at, status')
    .order('processed_at', { ascending: false })
    .limit(5)
    // PostgrestFilterBuilder is a thenable, not a Promise — it has no .catch().
    // Use the two-arg .then(onFulfilled, onRejected) to handle failures.
    .then(r => r, () => ({ data: null, error: null }))

  const users = allUsers.data ?? []
  const activeUsers    = users.filter(u => u.tier_status === 'active' || u.tier_status === 'trial')
  const cancelledUsers = users.filter(u => u.tier_status === 'cancelled' || u.tier_status === 'expired')
  const proUsers       = users.filter(u => u.tier === 'pro' && u.tier_status === 'active')
  const vipUsers       = users.filter(u => u.tier === 'vip' && u.tier_status === 'active')

  // The "Active Members" tile counts only tier_status in {active, trial}.
  // /admin/members deliberately renders the full non-admin roster (incl.
  // cancelled / expired) so admins can re-engage churned accounts. Labelling
  // the tile "Total Members" while filtering tier_status diverged from
  // /admin/members's count and looked like a bug to QA — relabel + sub-label
  // so the filter is explicit on screen.
  const activeMembers = activeUsers.length
  // Canonical MRR — same computeMrr + same non-admin member scope as
  // /admin/revenue, so the dashboard and revenue always report the same total.
  const mrr           = computeMrr(users)
  const proMembers    = proUsers.length
  const proLastMo     = proLastMonth.count ?? 0
  const totalEver     = activeUsers.length + cancelledUsers.length
  const retention     = totalEver > 0 ? Math.round(activeUsers.length / totalEver * 100) : 100
  const totalPosts    = postsCount.count ?? 0
  const publishedEpisodes = episodesCount.count ?? 0

  const stats = [
    {
      label:    'Active Members',
      value:    fmt(activeMembers),
      delta:    (newThisWeek.count ?? 0) > 0
        ? `+${newThisWeek.count} this week · excludes cancelled / expired`
        : 'excludes cancelled / expired',
      deltaPos: true,
      color:    '#ef0e30',
      bg:       'rgba(239,14,48,0.08)',
    },
    {
      label:    'MRR',
      value:    fmt(mrr, '$'),
      delta:    `from ${proMembers} professional + ${vipUsers.length} vip`,
      deltaPos: true,
      color:    '#68a2b9',
      bg:       'rgba(104,162,185,0.08)',
    },
    {
      label:    'Retention Rate',
      value:    `${retention}%`,
      delta:    'active vs total ever',
      deltaPos: retention >= 80,
      color:    '#1b3c5a',
      bg:       'rgba(27,60,90,0.06)',
    },
    {
      label:    'Pro Members',
      value:    fmt(proMembers),
      delta:    `${proMembers - proLastMo >= 0 ? '+' : ''}${proMembers - proLastMo} vs last month`,
      deltaPos: proMembers - proLastMo >= 0,
      color:    '#c9a84c',
      bg:       'rgba(201,168,76,0.08)',
    },
    {
      label:    'Total Posts',
      value:    fmt(totalPosts),
      delta:    'community feed',
      deltaPos: true,
      color:    '#a78bfa',
      bg:       'rgba(167,139,250,0.08)',
    },
    {
      label:    'Published Episodes',
      value:    fmt(publishedEpisodes),
      delta:    'live podcast catalog',
      deltaPos: true,
      color:    '#0ABFA3',
      bg:       'rgba(10,191,163,0.08)',
    },
  ]

  return (
    <div className="px-4 sm:px-8 py-6 max-w-5xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-display font-black text-[28px] text-[#112535]">Dashboard</h1>
          <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5" suppressHydrationWarning>
            Platform overview — {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <InviteMemberButton />
      </div>

      {/* Stat cards — 6 tiles; 2/3/3 grid keeps each tile readable instead of
          cramming all six onto a single 6-col row. */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <div
            key={s.label}
            className="rounded-lg p-5"
            style={{ backgroundColor: s.bg, border: `1px solid ${s.color}22` }}
          >
            <p className="font-condensed font-bold uppercase tracking-[0.16em] text-[9px] mb-2" style={{ color: s.color }}>
              {s.label}
            </p>
            <p className="font-display font-black text-[28px] leading-none mb-1" style={{ color: '#112535' }}>
              {s.value}
            </p>
            <p className="font-condensed text-[10px]" style={{ color: s.deltaPos ? '#16a34a' : '#ef0e30' }}>
              {s.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Members',  href: '/admin/members',  desc: 'Search, filter, view profiles' },
          { label: 'Pipeline', href: '/admin/pipeline', desc: 'Upgrade pipeline kanban' },
          { label: 'Revenue',  href: '/admin/revenue',  desc: 'MRR chart and breakdown' },
        ].map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="block rounded-lg p-4 cursor-pointer transition-all bg-white hover:bg-[#f3f7fa] border border-[#1b3c5a1a] hover:border-[#1b3c5a33] hover:shadow-sm"
          >
            <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[11px] text-[#1b3c5a] mb-1">{l.label} →</p>
            <p className="font-condensed text-[11px] text-[#7a8a96]">{l.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent signups */}
      <div className="rounded-lg overflow-x-auto mb-6" style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}>
          <p className="font-condensed font-bold uppercase tracking-[0.16em] text-[10px] text-[#1b3c5a]">Recent Signups</p>
          <Link href="/admin/members" className="font-condensed text-[10px] text-[#68a2b9] hover:text-[#1b3c5a] transition-colors">
            All members →
          </Link>
        </div>
        {(recentMembers.data ?? []).length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="font-condensed text-[12px] text-[#7a8a96]">No members yet.</p>
          </div>
        ) : (
          <table className="w-full min-w-[520px]">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.06)' }}>
                {['Name', 'Email', 'Tier', 'Joined'].map(h => (
                  <th key={h} className="px-5 py-2 text-left font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentMembers.data ?? []).map((m, i, arr) => (
                <tr key={m.id} style={{ borderBottom: i === arr.length - 1 ? 'none' : '1px solid rgba(27,60,90,0.06)' }}>
                  <td className="px-5 py-3">
                    <Link href={`/admin/members/${m.id}`} className="font-condensed text-[11px] text-[#1b3c5a] hover:text-[#ef0e30] transition-colors">
                      {m.full_name ?? m.display_name ?? '—'}
                    </Link>
                  </td>
                  <td className="px-5 py-3"><p className="font-condensed text-[11px] text-[#7a8a96]">{m.email ?? '—'}</p></td>
                  <td className="px-5 py-3">
                    {m.tier ? (
                      <span className="font-condensed font-bold uppercase text-[9px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(27,60,90,0.06)', color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.12)' }}>
                        {m.tier}
                      </span>
                    ) : (
                      <span className="font-condensed text-[11px] text-[#7a8a96]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3"><p className="font-condensed text-[11px] text-[#7a8a96]">{fmtDate(m.created_at)}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Vendasta webhooks */}
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}>
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}
        >
          <p className="font-condensed font-bold uppercase tracking-[0.16em] text-[10px] text-[#1b3c5a]">
            Recent Vendasta Activity
          </p>
          <a
            href="https://business.vendasta.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-condensed text-[10px] text-[#68a2b9] hover:text-[#1b3c5a] transition-colors"
          >
            Open Vendasta →
          </a>
        </div>

        {(() => {
          // Drop rows that would render as em-dashes for every meaningful
          // field — when neither the contact id nor the product sku is set,
          // the row is just placeholder noise and looks broken to QA.
          const rows = (recentWebhooks.data ?? []).filter(
            wh => (wh.vendasta_contact_id && String(wh.vendasta_contact_id).trim())
              || (wh.product_sku && String(wh.product_sku).trim()),
          )
          if (rows.length === 0) {
            return (
              <div className="px-5 py-8 text-center space-y-2">
                <p className="font-condensed text-[12px] text-[#7a8a96]">No recent Vendasta activity.</p>
                <a
                  href="https://business.vendasta.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-condensed text-[11px] text-[#68a2b9] hover:text-[#1b3c5a] underline transition-colors"
                >
                  Connect Vendasta to see member events here.
                </a>
              </div>
            )
          }
          return (
          <table className="w-full">
            <tbody>
              {rows.map((wh, i, arr) => {
                const sc = STATUS_COLORS[wh.status ?? ''] ?? STATUS_COLORS.error
                return (
                  <tr
                    key={wh.id}
                    style={{ borderBottom: i === arr.length - 1 ? 'none' : '1px solid rgba(27,60,90,0.06)' }}
                  >
                    <td className="px-5 py-3">
                      <span
                        className="font-condensed font-bold uppercase text-[9px] px-2 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(27,60,90,0.06)', color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.12)' }}
                      >
                        {wh.event_type}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-condensed text-[11px] text-[#7a8a96]">
                        {wh.vendasta_contact_id ?? '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-condensed text-[11px] text-[#7a8a96]">
                        {wh.product_sku ?? '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-condensed text-[11px] text-[#7a8a96]">{fmtDate(wh.processed_at)}</p>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className="font-condensed font-bold uppercase text-[9px] px-2 py-0.5 rounded"
                        style={{ backgroundColor: sc.bg, color: sc.color }}
                      >
                        {wh.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          )
        })()}
      </div>
    </div>
  )
}

