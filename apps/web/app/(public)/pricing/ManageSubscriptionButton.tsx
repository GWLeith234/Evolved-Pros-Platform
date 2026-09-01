'use client'

import { useState } from 'react'

/**
 * SPRINT PRICE-1 — the only place a paying member can reach their subscription.
 *
 * Posts to the existing /api/stripe/portal route (reused, not duplicated)
 * and follows the Stripe-hosted portal URL it returns. Used on /membership
 * (the account billing page) for members with a live paid plan.
 */
export function ManageSubscriptionButton() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function open() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Could not open the billing portal.')
        setBusy(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error — please try again.')
      setBusy(false)
    }
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button
        type="button"
        onClick={() => void open()}
        disabled={busy}
        className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] px-4 py-2 rounded transition-opacity hover:opacity-80"
        style={{
          color: 'var(--brand-gold)',
          background: 'transparent',
          border: '1px solid rgba(201,168,76,0.4)',
          cursor: busy ? 'wait' : 'pointer',
          opacity: busy ? 0.6 : 1,
          minHeight: 40,
        }}
      >
        {busy ? 'Opening…' : 'Manage subscription'}
      </button>
      {error && (
        <span role="alert" className="font-body text-[11px]" style={{ color: 'var(--brand-red-hot)' }}>
          {error}
        </span>
      )}
    </span>
  )
}
