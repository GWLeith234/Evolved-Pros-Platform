'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function MembershipExpiredContent() {
  const checkoutUrl = process.env.NEXT_PUBLIC_VENDASTA_CHECKOUT_URL ?? '#'
  const reason = useSearchParams().get('reason')
  const isCancelled = reason === 'cancelled'

  const headline = isCancelled
    ? 'Your membership was cancelled.'
    : 'Your membership has expired.'

  const subtext = isCancelled
    ? 'If this was a mistake, contact support. Otherwise, you can rejoin anytime to regain access to the community, events, and academy.'
    : 'Renew to regain access to the community, events, and academy.'

  return (
    <div
      className="w-full max-w-md rounded-xl p-10 text-center"
      style={{
        backgroundColor: '#112535',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <p
        className="font-condensed font-bold text-white tracking-[0.18em] text-base mb-8"
      >
        EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
      </p>

      {/* Icon */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: 'rgba(239,14,48,0.1)', border: '1px solid rgba(239,14,48,0.2)' }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef0e30"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      {/* Headline */}
      <h1
        className="font-display font-bold text-white mb-3"
        style={{ fontSize: '24px' }}
      >
        {headline}
      </h1>

      {/* Sub */}
      <p
        className="font-body text-sm mb-8 leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        {subtext}
      </p>

      {/* CTAs */}
      <div className="space-y-3">
        <Link
          href="/membership"
          className="block w-full py-3 rounded font-condensed font-semibold uppercase tracking-wide text-sm text-white text-center transition-colors"
          style={{ backgroundColor: '#ef0e30' }}
        >
          {isCancelled ? 'Rejoin Evolved Pros →' : 'Renew Membership →'}
        </Link>
        <Link
          href="mailto:support@evolvedpros.com"
          className="block w-full py-3 rounded font-condensed font-semibold uppercase tracking-wide text-sm transition-colors"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          Contact Support
        </Link>
      </div>
    </div>
  )
}

export default function MembershipExpiredPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#0d1c27' }}
    >
      <Suspense>
        <MembershipExpiredContent />
      </Suspense>
    </div>
  )
}
