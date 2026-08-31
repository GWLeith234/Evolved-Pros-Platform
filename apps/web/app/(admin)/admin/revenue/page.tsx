import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * Revenue is empty until VENDASTA-4 wires billing_events (Stripe).
 * Do not invent MRR from active tier counts × list price, and do not
 * synthesize a 6-month chart. The previous page did both; this stub
 * is the correct output of this sprint.
 */
export default async function AdminRevenuePage() {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[color:var(--admin-text-strong)]">Revenue</h1>
        <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mt-0.5">
          Empty until billing_events (Stripe). TODO(VENDASTA-4) — the billing provider is the source of truth.
        </p>
      </div>

      <div
        className="rounded-lg px-8 py-12 text-center"
        style={{
          backgroundColor: 'var(--admin-card)',
          border: '1px dashed rgba(27,60,90,0.2)',
        }}
      >
        <p className="font-condensed font-bold uppercase tracking-widest text-[11px] text-[color:var(--admin-text-2)]">
          No billing events yet
        </p>
        <p className="font-body text-[13px] text-[color:var(--admin-text-2)] mt-2 max-w-md mx-auto">
          MRR, churn, and the 6-month chart will populate when VENDASTA-4 reads{' '}
          <code className="font-condensed text-[12px]">billing_events</code>.
          This page does not estimate revenue from member counts or list price.
        </p>
      </div>
    </div>
  )
}
