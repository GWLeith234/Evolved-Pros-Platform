'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * SPRINT V-CHECKOUT — client CTA for the public /pricing tier cards.
 *
 * For free tier and Keynotes (non-Vendasta destinations) we just navigate.
 * For VIP / Professional we POST to /api/checkout with the configured SKU and
 * redirect the member to the Vendasta hosted payment URL on success.
 *
 * If the user isn't logged in yet, /api/checkout will return 401 — we route
 * them through /login with a returnTo back to /pricing so they can retry
 * after authenticating.
 */

interface PricingCtaButtonProps {
  label:    string
  href?:    string
  sku?:     string
  featured: boolean
}

export function PricingCtaButton({ label, href, sku, featured }: PricingCtaButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const baseStyle = {
    backgroundColor: featured ? '#C9302A' : 'rgba(245,240,232,0.06)',
    color:           featured ? '#fff'    : '#F5F0E8',
    border:          featured ? 'none'    : '1px solid rgba(245,240,232,0.1)',
  } as const

  const className =
    'block w-full py-3 rounded-lg font-condensed font-bold uppercase ' +
    'tracking-[0.1em] text-[12px] text-center transition-opacity hover:opacity-90'

  // Non-Vendasta CTAs — just a normal link.
  if (!sku) {
    return (
      <a href={href ?? '#'} className={className} style={baseStyle}>
        {label}
      </a>
    )
  }

  async function handleClick() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sku }),
      })
      if (res.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent('/pricing'))
        return
      }
      const data = (await res.json().catch(() => ({}))) as {
        paymentUrl?: string
        error?:      string
      }
      if (!res.ok || !data.paymentUrl) {
        setError(data.error ?? 'Checkout failed — please try again')
        setLoading(false)
        return
      }
      window.location.href = data.paymentUrl
    } catch {
      setError('Network error — please try again')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
        style={{
          ...baseStyle,
          opacity: loading ? 0.6 : 1,
          cursor:  loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Loading…' : label}
      </button>
      {error && (
        <p className="font-body text-[11px] mt-2 text-center" style={{ color: '#C9302A' }}>
          {error}
        </p>
      )}
    </div>
  )
}
