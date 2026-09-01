'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * SPRINT O — "Have a code?" redemption on the public /pricing page.
 *
 * A member enters a comp / access code (e.g. Friends of George). We POST to
 * /api/redeem, which grants the code's tier. If the visitor isn't signed in,
 * the API returns 401 and we route them through /login (mirroring the checkout
 * CTA's redirect convention) so they can authenticate and come back.
 *
 * This page is committed to the dark marketing palette (no theme toggle), so
 * the block matches the surrounding hardcoded dark tokens rather than the
 * member-app semantic tokens.
 */

const GOLD = '#C9A84C'
const TEAL = '#0ABFA3'
const RED = '#C9302A'
const INK = '#F5F0E8'

type Status = 'idle' | 'loading' | 'success' | 'error'

function tierDisplayName(tier: string | null | undefined): string {
  if (tier === 'pro') return 'Professional'
  if (tier === 'vip') return 'VIP'
  if (tier === 'community') return 'Community'
  return tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'your new tier'
}

export function RedeemCodeForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [grantedTier, setGrantedTier] = useState<string | null>(null)
  const [alreadyRedeemed, setAlreadyRedeemed] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed || status === 'loading') return
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })
      if (res.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent('/pricing'))
        return
      }
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        tier?: string
        alreadyRedeemed?: boolean
        error?: string
      }
      if (!res.ok || !data.ok) {
        setStatus('error')
        setError(data.error ?? "That code isn't valid.")
        return
      }
      setGrantedTier(data.tier ?? null)
      setAlreadyRedeemed(Boolean(data.alreadyRedeemed))
      setStatus('success')
    } catch {
      setStatus('error')
      setError('Network error — please try again.')
    }
  }

  if (status === 'success') {
    const tierName = tierDisplayName(grantedTier)
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ backgroundColor: '#111926', border: `1px solid ${TEAL}40` }}
      >
        <p
          className="font-condensed font-bold uppercase tracking-[0.16em] text-[10px] mb-2"
          style={{ color: TEAL }}
        >
          {alreadyRedeemed ? "You're all set" : 'Welcome to the inner circle'}
        </p>
        <h3 className="font-display font-bold text-2xl mb-2" style={{ color: INK }}>
          {tierName} unlocked.
        </h3>
        <p className="font-body text-[13px] mb-5" style={{ color: 'rgba(245,240,232,0.55)' }}>
          {alreadyRedeemed
            ? `You've already redeemed this code — your ${tierName} access is active.`
            : `Your access is live. Everything in ${tierName} is now open to you.`}
        </p>
        <a
          href="/home"
          className="inline-block py-3 px-6 rounded-lg font-condensed font-bold uppercase tracking-[0.1em] text-[12px] transition-opacity hover:opacity-90"
          style={{ backgroundColor: TEAL, color: '#06231F' }}
        >
          Enter the platform →
        </a>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: '#111926', border: '1px solid rgba(245,240,232,0.08)' }}
    >
      <p
        className="font-condensed font-bold uppercase tracking-[0.16em] text-[10px] mb-1.5"
        style={{ color: GOLD }}
      >
        Have a code?
      </p>
      <p className="font-body text-[13px] mb-4" style={{ color: 'rgba(245,240,232,0.55)' }}>
        Friends of George and invited guests: enter your access code to unlock your membership.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={code}
          onChange={e => {
            setCode(e.target.value)
            if (status === 'error') setStatus('idle')
          }}
          placeholder="Enter your code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-label="Access code"
          className="flex-1 px-4 py-3 rounded-lg font-body text-[14px] outline-none"
          style={{
            backgroundColor: 'rgba(10,15,24,0.6)',
            border: '1px solid rgba(245,240,232,0.14)',
            color: INK,
            letterSpacing: '0.04em',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading' || !code.trim()}
          className="py-3 px-6 rounded-lg font-condensed font-bold uppercase tracking-[0.1em] text-[12px] transition-opacity hover:opacity-90"
          style={{
            backgroundColor: GOLD,
            color: '#241B06',
            opacity: status === 'loading' || !code.trim() ? 0.55 : 1,
            cursor: status === 'loading' ? 'wait' : 'pointer',
          }}
        >
          {status === 'loading' ? 'Redeeming…' : 'Redeem'}
        </button>
      </form>
      {status === 'error' && error && (
        <p className="font-body text-[12px] mt-3" style={{ color: RED }}>
          {error}
        </p>
      )}
    </div>
  )
}
