'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * SPRINT V-CHECKOUT — client CTA for the public /pricing tier cards.
 *
 * For free tier and Keynotes (non-checkout destinations) we just navigate.
 * For VIP / Professional we POST to the active checkout route and redirect the
 * member to the hosted payment URL on success.
 *
 * SPRINT I Phase 2 — this page now honours the SAME provider switch the
 * /membership upgrade CTA uses. Previously /pricing was hardwired to Vendasta
 * SKUs: once the NEXT_PUBLIC_VENDASTA_MP_* vars were removed, `sku` fell back
 * to '' and both paid CTAs silently rendered as dead `#` links on the public,
 * unauthenticated top of the funnel. Under 'stripe' the plan key drives
 * checkout instead, so the anonymous page and the member page cannot diverge.
 *
 * If the user isn't logged in yet, both checkout routes return 401 — we route
 * them through /login with a redirect back to /pricing so they can retry
 * after authenticating.
 */

type StripePlanKey = 'vip_monthly' | 'vip_annual' | 'pro_monthly' | 'pro_annual'

const PAYMENTS_PROVIDER = process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER ?? 'vendasta'
const USE_STRIPE = PAYMENTS_PROVIDER === 'stripe'

interface PricingCtaButtonProps {
  label:    string
  href?:    string
  sku?:     string
  /** Stripe plan key — used when NEXT_PUBLIC_PAYMENTS_PROVIDER === 'stripe'. */
  plan?:    StripePlanKey
  featured: boolean
}

export function PricingCtaButton({ label, href, sku, plan, featured }: PricingCtaButtonProps) {
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

  // Under Stripe a valid plan key is what makes a card purchasable; under the
  // legacy Vendasta path it's a configured SKU. Free tier and Keynotes carry
  // neither and stay plain navigation links.
  const canCheckout = USE_STRIPE ? Boolean(plan) : Boolean(sku)
  if (!canCheckout) {
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
      const res = await fetch(USE_STRIPE ? '/api/stripe/checkout' : '/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(USE_STRIPE ? { plan } : { sku }),
      })
      if (res.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent('/pricing'))
        return
      }
      const data = (await res.json().catch(() => ({}))) as {
        // Stripe returns { url }; Vendasta returns { paymentUrl }.
        url?:        string
        paymentUrl?: string
        error?:      string
      }
      const redirectUrl = data.url ?? data.paymentUrl
      if (!res.ok || !redirectUrl) {
        setError(data.error ?? 'Checkout failed — please try again')
        setLoading(false)
        return
      }
      window.location.href = redirectUrl
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
