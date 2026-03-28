'use client'

import { useState } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'

interface MembershipPageClientProps {
  userTier: string | null
  keynoteAccess: boolean
}

const CHECKOUT_BASE       = process.env.NEXT_PUBLIC_VENDASTA_CHECKOUT_URL ?? ''
const KEYNOTE_INQUIRY_URL = process.env.NEXT_PUBLIC_VENDASTA_KEYNOTE_INQUIRY_URL
  ?? 'mailto:geoleith@gmail.com?subject=Keynote%20Inquiry%20-%20Evolved%20Pros'

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// CtaButton — checkout CTA for VIP / Professional cards
// isCurrent: renders a plain "Current Plan" disabled button (no tooltip)
// ---------------------------------------------------------------------------

interface CtaButtonProps {
  sku: string
  accent: string
  featured?: boolean
  isCurrent?: boolean
  label?: string
}

function CtaButton({ sku, accent, featured = false, isCurrent = false, label }: CtaButtonProps) {
  if (isCurrent) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-3 rounded font-condensed font-bold uppercase tracking-[0.12em] text-[12px]"
        style={{
          backgroundColor: 'transparent',
          color: accent,
          border: `1.5px solid ${accent}`,
          opacity: 0.45,
          cursor: 'default',
        }}
      >
        Current Plan
      </button>
    )
  }

  const checkoutUrl = CHECKOUT_BASE ? `${CHECKOUT_BASE}?sku=${sku}` : ''

  if (checkoutUrl) {
    return (
      <a
        href={checkoutUrl}
        className="block w-full py-3 rounded font-condensed font-bold uppercase tracking-[0.12em] text-[12px] text-center transition-opacity hover:opacity-90"
        style={{ backgroundColor: accent, color: 'white' }}
      >
        {label ?? 'Get Started'}
      </a>
    )
  }

  return (
    <Tooltip content="Checkout powered by Vendasta — launching soon">
      <button
        type="button"
        disabled
        className="w-full py-3 rounded font-condensed font-bold uppercase tracking-[0.12em] text-[12px] transition-opacity"
        style={{
          backgroundColor: featured ? accent : 'transparent',
          color: featured ? 'white' : accent,
          border: `1.5px solid ${accent}`,
          opacity: 0.6,
          cursor: 'not-allowed',
        }}
      >
        Coming Soon
      </button>
    </Tooltip>
  )
}

// ---------------------------------------------------------------------------
// KeynoteCta — always live; shows inquiry link or "Active" badge
// ---------------------------------------------------------------------------

function KeynoteCta({ hasAccess }: { hasAccess: boolean }) {
  if (hasAccess) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-3 rounded font-condensed font-bold uppercase tracking-[0.12em] text-[12px]"
        style={{
          backgroundColor: 'transparent',
          color: '#A78BFA',
          border: '1.5px solid #A78BFA',
          opacity: 0.45,
          cursor: 'default',
        }}
      >
        Active
      </button>
    )
  }

  return (
    <a
      href={KEYNOTE_INQUIRY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full py-3 rounded font-condensed font-bold uppercase tracking-[0.12em] text-[12px] text-center transition-opacity hover:opacity-90"
      style={{ backgroundColor: '#A78BFA', color: 'white' }}
    >
      Inquire about availability →
    </a>
  )
}

const VIP_FEATURES = [
  'Community hub + all channels',
  'Academy: Pillars 1–4',
  'Standard member events',
  'Member directory + direct messages',
  'Leaderboard + weekly points',
]

const PRO_FEATURES = [
  'Everything in VIP',
  'Academy: Pillars 5 + 6',
  'Pro-exclusive events',
  'Priority community support',
  'Full 6-pillar framework access',
]

const KEYNOTE_FEATURES = [
  'Keynote speaking events only',
  'Stacks with any membership tier',
  'One-time or annual purchase',
  'Exclusive speaker access',
]

export function MembershipPageClient({ userTier, keynoteAccess }: MembershipPageClientProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const isAnnual = billing === 'annual'

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{ backgroundColor: '#0A0F18' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-condensed font-bold uppercase tracking-[0.22em] text-[10px] mb-2" style={{ color: '#68a2b9' }}>
            Membership
          </p>
          <h1 className="font-display font-black text-white mb-3" style={{ fontSize: 'clamp(28px, 5vw, 44px)', lineHeight: 1.1 }}>
            Choose your tier.
          </h1>
          <p className="font-body text-[15px] leading-relaxed max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Every plan includes full access to the Evolved Pros community. Upgrade your tier to unlock more pillars and exclusive events.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[11px] px-5 py-2 rounded transition-all"
            style={{
              backgroundColor: billing === 'monthly' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: billing === 'monthly' ? 'white' : 'rgba(255,255,255,0.4)',
              border: billing === 'monthly' ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
            }}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling('annual')}
            className="flex items-center gap-2 font-condensed font-bold uppercase tracking-[0.12em] text-[11px] px-5 py-2 rounded transition-all"
            style={{
              backgroundColor: billing === 'annual' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: billing === 'annual' ? 'white' : 'rgba(255,255,255,0.4)',
              border: billing === 'annual' ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
            }}
          >
            Annual
            <span
              className="font-condensed font-black text-[8px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              Save 17%
            </span>
          </button>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

          {/* VIP card */}
          <div
            className="relative rounded-xl p-6 flex flex-col"
            style={{
              backgroundColor: '#111926',
              border: userTier === 'vip' ? '1.5px solid #C9A84C' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {userTier === 'vip' && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 font-condensed font-black uppercase tracking-[0.14em] text-[9px] px-3 py-1 rounded-full"
                style={{ backgroundColor: '#C9A84C', color: '#0A0F18' }}
              >
                Your current plan
              </div>
            )}

            {/* Name + accent */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="font-condensed font-black uppercase tracking-[0.14em] text-[10px] px-2.5 py-1 rounded"
                  style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.25)' }}
                >
                  VIP
                </span>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="font-display font-black text-white" style={{ fontSize: '36px', lineHeight: 1 }}>
                  {isAnnual ? '$390' : '$39'}
                </span>
                <span className="font-condensed text-[13px] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {isAnnual ? '/ yr' : '/ mo'}
                </span>
              </div>
              {isAnnual && (
                <p className="font-condensed text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  $32.50 / mo billed annually
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="mb-4" style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />

            {/* Features */}
            <ul className="flex-1 space-y-2.5 mb-6">
              {VIP_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: '#C9A84C' }}><CheckIcon /></span>
                  <span className="font-body text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                </li>
              ))}
            </ul>

            <CtaButton
              sku={isAnnual ? 'EP-VIP-Y' : 'EP-VIP-M'}
              accent="#C9A84C"
              label="Get VIP"
              isCurrent={userTier === 'vip'}
            />
          </div>

          {/* Professional card — featured */}
          <div
            className="relative rounded-xl p-6 flex flex-col md:-mt-4 md:-mb-4"
            style={{
              backgroundColor: '#1a0f10',
              border: userTier === 'pro'
                ? '1.5px solid #C9302A'
                : '1.5px solid rgba(201,48,42,0.45)',
              boxShadow: '0 8px 32px rgba(201,48,42,0.18)',
            }}
          >
            {/* Recommended / current plan badge */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 font-condensed font-black uppercase tracking-[0.14em] text-[9px] px-3 py-1 rounded-full"
              style={{ backgroundColor: '#C9302A', color: 'white' }}
            >
              <StarIcon />
              {userTier === 'pro' ? 'Your current plan' : 'Recommended'}
            </div>

            {/* Name + accent */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="font-condensed font-black uppercase tracking-[0.14em] text-[10px] px-2.5 py-1 rounded"
                  style={{ backgroundColor: 'rgba(201,48,42,0.15)', color: '#C9302A', border: '1px solid rgba(201,48,42,0.3)' }}
                >
                  Professional
                </span>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="font-display font-black text-white" style={{ fontSize: '36px', lineHeight: 1 }}>
                  {isAnnual ? '$790' : '$79'}
                </span>
                <span className="font-condensed text-[13px] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {isAnnual ? '/ yr' : '/ mo'}
                </span>
              </div>
              {isAnnual && (
                <p className="font-condensed text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  $65.83 / mo billed annually
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="mb-4" style={{ height: '1px', backgroundColor: 'rgba(201,48,42,0.2)' }} />

            {/* Features */}
            <ul className="flex-1 space-y-2.5 mb-6">
              {PRO_FEATURES.map((f, i) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: i === 0 ? 'rgba(255,255,255,0.3)' : '#C9302A' }}
                  >
                    <CheckIcon />
                  </span>
                  <span
                    className="font-body text-[13px]"
                    style={{ color: i === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.7)' }}
                  >
                    {f}
                  </span>
                </li>
              ))}
            </ul>

            <CtaButton
              sku={isAnnual ? 'EP-PRO-Y' : 'EP-PRO-M'}
              accent="#C9302A"
              featured
              label="Get Professional"
              isCurrent={userTier === 'pro'}
            />
          </div>

          {/* Keynote add-on card */}
          <div
            className="relative rounded-xl p-6 flex flex-col"
            style={{
              backgroundColor: '#111926',
              border: keynoteAccess ? '1.5px solid #A78BFA' : '1px solid rgba(167,139,250,0.2)',
            }}
          >
            {keynoteAccess && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 font-condensed font-black uppercase tracking-[0.14em] text-[9px] px-3 py-1 rounded-full"
                style={{ backgroundColor: '#A78BFA', color: '#0A0F18' }}
              >
                Active
              </div>
            )}

            {/* Add-on pill */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="font-condensed font-black uppercase tracking-[0.14em] text-[10px] px-2.5 py-1 rounded"
                style={{ backgroundColor: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.25)' }}
              >
                Add-On
              </span>
              <span
                className="font-condensed font-bold uppercase tracking-[0.12em] text-[9px] px-2 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(167,139,250,0.08)', color: 'rgba(167,139,250,0.6)', border: '1px solid rgba(167,139,250,0.15)' }}
              >
                Keynote
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-end gap-1.5">
                <span className="font-display font-black text-white" style={{ fontSize: '36px', lineHeight: 1 }}>
                  From $7,500
                </span>
              </div>
              <p className="font-condensed text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                USD + travel &amp; accommodations
              </p>
            </div>

            {/* Divider */}
            <div className="mb-4" style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />

            {/* Features */}
            <ul className="flex-1 space-y-2.5 mb-6">
              {KEYNOTE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: '#A78BFA' }}><CheckIcon /></span>
                  <span className="font-body text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                </li>
              ))}
            </ul>

            <KeynoteCta hasAccess={keynoteAccess} />
          </div>
        </div>

        {/* Book offer banner */}
        <div
          className="rounded-xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(17,25,38,0.6) 100%)',
            border: '1px solid rgba(201,168,76,0.2)',
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-condensed font-black uppercase tracking-[0.14em] text-[9px] px-2 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}
              >
                Book Offer
              </span>
            </div>
            <p className="font-display font-bold text-white text-[16px] leading-snug">
              Pre-order <em>EVOLVED</em> → Unlock 6 months of VIP free
            </p>
            <p className="font-body text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Purchase the book and receive automatic VIP membership activation — no extra steps.
            </p>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <Tooltip content="Checkout powered by Vendasta — launching soon">
              <button
                type="button"
                disabled
                className="w-full sm:w-auto px-6 py-2.5 rounded font-condensed font-bold uppercase tracking-[0.12em] text-[11px]"
                style={{
                  border: '1.5px solid rgba(201,168,76,0.4)',
                  color: '#c9a84c',
                  opacity: 0.6,
                  cursor: 'not-allowed',
                  whiteSpace: 'nowrap',
                }}
              >
                Get the Book — Coming Soon
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center font-body text-[11px] mt-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
          All plans are billed in USD. Cancel anytime. Questions?{' '}
          <a href="mailto:support@evolvedpros.com" className="underline" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}
