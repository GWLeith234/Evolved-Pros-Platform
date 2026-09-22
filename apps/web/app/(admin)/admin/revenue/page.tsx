import { headers } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { AdminMetricCard, AdminMetricRow, AdminTable, AdminTd, AdminTh } from '@/components/admin/template'
import { getRevenueSnapshot } from '@/lib/stripe/revenue'
import { formatMoneyCents } from '@/lib/stripe/mrr'
import { allSeatStatuses } from '@/lib/commerce/seats'
import { TIER_LABELS, toTierKey } from '@/lib/entitlements'

export const dynamic = 'force-dynamic'

/**
 * Revenue and seats.
 *
 * SPRINT K replaced the "no billing events yet" stub: MRR is read from live
 * Stripe subscriptions. SPRINT L adds the seat ledger for capped products,
 * because "how many of the 99 are left" is the number that decides whether
 * there is anything to sell this week.
 *
 * Nothing here is estimated from member count or list price. A figure is
 * either Stripe's or it is absent.
 */

interface WaitlistRow {
  id: string
  email: string
  full_name: string | null
  status: string
  source: string
  created_at: string
}

async function fetchWaitlist(): Promise<WaitlistRow[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (adminClient as any)
      .from('seat_waitlist')
      .select('id, email, full_name, status, source, created_at')
      .in('status', ['waiting', 'offered'])
      .order('created_at', { ascending: true })
      .limit(100)
    return (data ?? []) as WaitlistRow[]
  } catch {
    // The table may not exist until migration 094 runs.
    return []
  }
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function AdminRevenuePage() {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  const [revenue, seats, waitlist] = await Promise.all([
    getRevenueSnapshot(),
    allSeatStatuses(),
    fetchWaitlist(),
  ])

  return (
    <div className="px-4 sm:px-8 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[color:var(--admin-text-strong)]">Revenue</h1>
        <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mt-0.5">
          Read from Stripe. Nothing on this page is estimated from member count or list price.
        </p>
      </div>

      <AdminMetricRow columns={2}>
        <AdminMetricCard
          label="MRR"
          value={revenue.available ? formatMoneyCents(revenue.mrrCents) : 'n/a'}
          hint={revenue.available ? 'Active + trialing subscriptions' : 'Could not reach Stripe'}
        />
        <AdminMetricCard
          label="Paid members"
          value={revenue.available ? String(revenue.paidCount) : 'n/a'}
          hint={
            revenue.available
              ? `${revenue.paidByTier.vip} VIP · ${revenue.paidByTier.professional} The 99`
              : 'Could not reach Stripe'
          }
        />
        <AdminMetricCard
          label="VIP MRR"
          value={revenue.available ? formatMoneyCents(revenue.mrrByTier.vip) : 'n/a'}
          hint={`${revenue.paidByTier.vip} subscription${revenue.paidByTier.vip === 1 ? '' : 's'}`}
        />
        <AdminMetricCard
          label="The 99 MRR"
          value={revenue.available ? formatMoneyCents(revenue.mrrByTier.professional) : 'n/a'}
          hint={`${revenue.paidByTier.professional} subscription${revenue.paidByTier.professional === 1 ? '' : 's'}`}
        />
      </AdminMetricRow>

      {/* ── Seats ─────────────────────────────────────────────────────── */}
      <h2 className="font-display font-black text-[20px] text-[color:var(--admin-text-strong)] mt-10 mb-1">
        Seats
      </h2>
      <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mb-4">
        Counted from live Stripe subscriptions, so a cancelled seat returns to the pool.
      </p>

      {seats.length === 0 ? (
        <div
          className="rounded-lg px-8 py-10 text-center"
          style={{ backgroundColor: 'var(--admin-card)', border: '1px dashed rgba(27,60,90,0.2)' }}
        >
          <p className="font-condensed font-bold uppercase tracking-widest text-[11px] text-[color:var(--admin-text-2)]">
            No capped products
          </p>
          <p className="font-body text-[13px] text-[color:var(--admin-text-2)] mt-2 max-w-md mx-auto">
            Set <code>products.seat_cap</code> to put a room on a cap. Until migration 094 runs
            there is nothing to count.
          </p>
        </div>
      ) : (
        <AdminMetricRow columns={2}>
          {seats.flatMap(seat => [
            <AdminMetricCard
              key={`${seat.tier}-sold`}
              label={`${TIER_LABELS[toTierKey(seat.tier)]} · seats sold`}
              value={seat.status.known ? `${seat.status.taken} / ${seat.status.cap}` : 'n/a'}
              hint={seat.status.known ? 'Active + trialing' : 'Could not reach Stripe'}
            />,
            <AdminMetricCard
              key={`${seat.tier}-left`}
              label={`${TIER_LABELS[toTierKey(seat.tier)]} · seats left`}
              value={seat.status.known ? String(seat.status.remaining ?? 0) : 'n/a'}
              hint={
                seat.status.known && seat.status.soldOut
                  ? `Sold out. ${seat.waiting} waiting.`
                  : `${seat.waiting} on the waitlist`
              }
            />,
          ])}
        </AdminMetricRow>
      )}

      {/* ── Waitlist ──────────────────────────────────────────────────── */}
      <h2 className="font-display font-black text-[20px] text-[color:var(--admin-text-strong)] mt-10 mb-1">
        Waitlist
      </h2>
      <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mb-4">
        People who tried to buy a sold-out seat, in arrival order.
      </p>

      {waitlist.length === 0 ? (
        <div
          className="rounded-lg px-8 py-10 text-center"
          style={{ backgroundColor: 'var(--admin-card)', border: '1px dashed rgba(27,60,90,0.2)' }}
        >
          <p className="font-condensed font-bold uppercase tracking-widest text-[11px] text-[color:var(--admin-text-2)]">
            Nobody waiting
          </p>
        </div>
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Member</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh>Source</AdminTh>
              <AdminTh>Joined</AdminTh>
            </tr>
          </thead>
          <tbody>
            {waitlist.map(row => (
              <tr key={row.id}>
                <AdminTd>{row.full_name || row.email}</AdminTd>
                <AdminTd>{row.status}</AdminTd>
                <AdminTd>{row.source}</AdminTd>
                <AdminTd>{fmtDate(row.created_at)}</AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  )
}
