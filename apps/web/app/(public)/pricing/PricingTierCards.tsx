'use client'

import { useState } from 'react'
import { PricingCtaButton } from './PricingCtaButton'
import { ANNUAL_FREE_MONTHS, type TierKey, type TierPrice } from '@/lib/pricing'

// Tier presentation is static; only the amounts come from the catalogue
// (passed in as `pricing`). The monthly/annual toggle switches which amount the
// paid tiers display — the counterpart amount stays visible as the sub-note so
// all four numbers are reachable in either toggle state.

interface Feature {
  text: string
  locked?: boolean
}

type Billing = 'monthly' | 'annual'

interface TierDef {
  name: string
  /** Catalogue pricing key; omitted for the fixed-price cards. */
  priceKey?: Extract<TierKey, 'vip' | 'professional'>
  /** Fixed display for non-catalogue cards (Community free, Keynotes inquiry). */
  fixedPrice?: string
  fixedPeriod?: string
  badge: string
  badgeColor: string
  featured?: boolean
  popular?: boolean
  keynote?: boolean
  features: Feature[]
  callout?: string
  cta: string
  ctaHref?: string
  ctaSku?: string
  /** Stripe plan family; combined with the billing toggle into a plan key. */
  ctaPlanBase?: 'vip' | 'pro'
}

export function PricingTierCards({
  pricing,
  vipSku,
  proSku,
}: {
  pricing: Record<TierKey, TierPrice>
  vipSku: string
  proSku: string
}) {
  const [billing, setBilling] = useState<Billing>('monthly')
  const isAnnual = billing === 'annual'

  const tiers: TierDef[] = [
    {
      name: 'Community',
      fixedPrice: 'Free',
      fixedPeriod: 'forever',
      badge: 'Community',
      badgeColor: '#60A5FA',
      features: [
        { text: 'Community feed' },
        { text: 'Podcast library' },
        { text: 'Event discovery' },
        { text: 'Academy', locked: true },
        { text: 'Own the Day', locked: true },
        { text: 'Home dashboard', locked: true },
      ],
      cta: 'Join free',
      ctaHref: '/login?mode=signup',
    },
    {
      name: 'VIP',
      priceKey: 'vip',
      badge: 'VIP',
      badgeColor: '#C9A84C',
      features: [
        { text: 'Everything in Community' },
        { text: 'Event registration' },
        { text: 'Academy Pillars 1–3' },
        { text: 'Own the Day' },
        { text: 'Accountability (your #1 goal)', locked: true },
        { text: 'Academy Pillars 4–6', locked: true },
      ],
      cta: 'Start VIP',
      ctaSku: vipSku,
      ctaPlanBase: 'vip',
    },
    {
      name: 'Professional',
      priceKey: 'professional',
      badge: 'Professional',
      badgeColor: '#C9302A',
      featured: true,
      popular: true,
      features: [
        { text: 'Everything in VIP' },
        { text: 'Full 6-Pillar Academy' },
        { text: 'Accountability system' },
        { text: 'Priority events' },
      ],
      callout: 'Bi-weekly 1hr mastermind with George. Topics rotate through all 6 EVOLVED pillars.',
      cta: 'Go Professional',
      ctaSku: proSku,
      ctaPlanBase: 'pro',
    },
    {
      name: 'Keynotes',
      fixedPrice: 'Inquire',
      fixedPeriod: 'for fee',
      badge: 'Keynotes',
      badgeColor: '#C9A84C',
      keynote: true,
      features: [
        { text: 'Custom keynote' },
        { text: 'EVOLVED Architecture talks' },
        { text: 'Half-day & full-day formats' },
        { text: 'Virtual or in-person' },
      ],
      cta: 'Book George',
      ctaHref: '/live',
    },
  ]

  function priceParts(t: TierDef): { price: string; period?: string; note?: string } {
    if (t.fixedPrice) return { price: t.fixedPrice, period: t.fixedPeriod }
    const p = pricing[t.priceKey!]
    const monthly = `$${p.monthly.toLocaleString('en-US')}`
    const annual = `$${p.annual.toLocaleString('en-US')}`
    return isAnnual
      ? { price: annual, period: '/year', note: `${monthly}/mo billed monthly` }
      : { price: monthly, period: '/month', note: `${annual}/yr · ${ANNUAL_FREE_MONTHS} months free` }
  }

  return (
    <>
      {/* Monthly / Annual toggle */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {(['monthly', 'annual'] as const).map(mode => {
          const active = billing === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setBilling(mode)}
              aria-pressed={active}
              className="flex items-center gap-2 font-condensed font-bold uppercase tracking-[0.12em] text-[11px] px-5 py-2 rounded transition-all"
              style={{
                backgroundColor: active ? 'rgba(245,240,232,0.1)' : 'transparent',
                color: active ? '#F5F0E8' : 'rgba(245,240,232,0.4)',
                border: active ? '1px solid rgba(245,240,232,0.15)' : '1px solid transparent',
              }}
            >
              {mode === 'monthly' ? 'Monthly' : 'Annual'}
              {mode === 'annual' && (
                <span
                  className="font-condensed font-black text-[8px] px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: 'rgba(201,168,76,0.2)',
                    color: '#C9A84C',
                    border: '1px solid rgba(201,168,76,0.3)',
                  }}
                >
                  {ANNUAL_FREE_MONTHS} months free
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-20">
        {tiers.map(tier => {
          const { price, period, note } = priceParts(tier)
          return (
            <div
              key={tier.name}
              className="rounded-xl p-6 flex flex-col"
              style={{
                backgroundColor: '#111926',
                border: tier.featured
                  ? '1.5px solid #C9302A'
                  : tier.keynote
                  ? '1.5px dashed rgba(201,168,76,0.4)'
                  : '1px solid rgba(245,240,232,0.06)',
              }}
            >
              {/* Badge */}
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] px-2.5 py-1 rounded"
                  style={{
                    backgroundColor: `${tier.badgeColor}18`,
                    color: tier.badgeColor,
                    border: `1px solid ${tier.badgeColor}30`,
                  }}
                >
                  {tier.badge}
                </span>
                {tier.popular && (
                  <span
                    className="font-condensed font-bold uppercase tracking-[0.1em] text-[8px] px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(201,48,42,.1)', color: '#C9302A' }}
                  >
                    Most popular
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mb-5">
                <span className="font-display font-bold text-3xl" style={{ color: '#F5F0E8' }}>
                  {price}
                </span>
                {period && (
                  <span className="font-body text-sm ml-1" style={{ color: 'rgba(245,240,232,0.4)' }}>
                    {period}
                  </span>
                )}
                {note && (
                  <p
                    className="font-condensed uppercase tracking-[0.1em] text-[11px] mt-1.5"
                    style={{ color: '#0ABFA3' }}
                  >
                    {note}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {tier.features.map(f => (
                  <li
                    key={f.text}
                    className="flex items-start gap-2 text-[13px] font-body"
                    style={{ color: f.locked ? 'rgba(245,240,232,0.25)' : 'rgba(245,240,232,0.7)' }}
                  >
                    <span
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: f.locked ? 'rgba(245,240,232,0.15)' : '#0ABFA3' }}
                    >
                      {f.locked ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>

              {/* Mastermind callout */}
              {tier.callout && (
                <div
                  className="rounded-lg p-4 mb-6"
                  style={{
                    backgroundColor: 'rgba(201,48,42,0.08)',
                    border: '1px solid rgba(201,48,42,0.15)',
                  }}
                >
                  <p
                    className="font-condensed font-bold uppercase tracking-[0.12em] text-[9px] mb-1.5"
                    style={{ color: '#C9302A' }}
                  >
                    Mastermind
                  </p>
                  <p className="font-body text-[12px] leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>
                    {tier.callout}
                  </p>
                </div>
              )}

              {/* CTA */}
              <PricingCtaButton
                label={tier.cta}
                href={tier.ctaHref}
                sku={tier.ctaSku}
                plan={
                  tier.ctaPlanBase
                    ? (`${tier.ctaPlanBase}_${isAnnual ? 'annual' : 'monthly'}` as const)
                    : undefined
                }
                featured={!!tier.featured}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}
