import { ANNUAL_BILLING_TOOLTIP } from '@/lib/live/s4-cta'
import { PricingCtaButton } from './PricingCtaButton'
import {
  ANNUAL_FREE_MONTHS,
  pricingLadderState,
  type LadderTier,
  type TierKey,
  type TierPrice,
} from '@/lib/pricing'
import { hasTierAccess } from '@/lib/tier'

// Server-rendered ladder. The monthly/annual switch is CSS :has() so the
// cards (copy + amounts) stay HTML and do not hydrate. Only checkout CTAs
// remain client islands. Annual keeps ANNUAL_BILLING_TOOLTIP via title.

interface Feature {
  text: string
  locked?: boolean
}

interface TierDef {
  name: string
  /** Catalogue pricing key; omitted for the fixed-price cards. */
  priceKey?: Extract<TierKey, 'vip' | 'professional'>
  /** Fixed display for non-catalogue cards (Community free, Keynotes inquiry). */
  fixedPrice?: string
  fixedPeriod?: string
  badge: string
  badgeColor: string
  /** One-line positioning under the tier name (SPRINT TIER-1). */
  tagline?: string
  featured?: boolean
  popular?: boolean
  keynote?: boolean
  features: Feature[]
  callout?: string
  cta: string
  ctaHref?: string
  /** Stripe plan family; combined with the billing toggle into a plan key. */
  ctaPlanBase?: 'vip' | 'pro'
  /**
   * Where this card sits on the entitlement ladder. Omitted for Keynotes, which
   * is an inquiry rather than a subscription and is never "owned".
   */
  tierKey?: LadderTier
}

export function PricingTierCards({
  pricing,
  currentTier = null,
}: {
  pricing: Record<TierKey, TierPrice>
  /**
   * The viewer's EFFECTIVE tier (already run through effectiveTier by the
   * page), or null when anonymous / free. Drives current-plan marking so an
   * existing subscriber is never shown a buy button for a plan they own —
   * clicking one opened a second Stripe subscription against the same customer.
   */
  currentTier?: string | null
}) {
  const tiers: TierDef[] = [
    // SPRINT TIER-1 — the approved ladder. Gate the Academy, open everything
    // else: free carries the whole community/events/podcast/media/habits
    // product plus Pillar 1 and the full assessment. The paid tiers sell the
    // curriculum (inner game, then outer game) and access to George.
    // Copy + feature lists only — checkout wiring below is untouched.
    {
      name: 'Community',
      fixedPrice: 'Free',
      fixedPeriod: 'forever',
      badge: 'Community',
      badgeColor: '#60A5FA',
      tagline: 'Everything but the curriculum',
      features: [
        { text: 'Full community feed' },
        { text: 'Events, podcast & media' },
        { text: 'Habits & Own the Day' },
        { text: 'Academy Pillar 1: Foundation — complete' },
        { text: 'The Pillar Assessment, all six scores' },
        { text: 'Academy Pillars 2–6', locked: true },
      ],
      cta: 'Join free',
      ctaHref: '/login?mode=signup',
      tierKey: 'community',
    },
    {
      name: 'VIP',
      priceKey: 'vip',
      badge: 'VIP',
      badgeColor: '#C9A84C',
      tagline: 'Master the inner game',
      features: [
        { text: 'Everything in Community' },
        { text: 'Pillar 1: Foundation' },
        { text: 'Pillar 2: Identity' },
        { text: 'Pillar 3: Mental Toughness' },
        { text: 'Monthly mastermind' },
        { text: 'Full assessment breakdown + pillar plan' },
        { text: 'Academy Pillars 4–6', locked: true },
      ],
      cta: 'Start VIP',
      ctaPlanBase: 'vip',
      tierKey: 'vip',
    },
    {
      name: 'Professional',
      priceKey: 'professional',
      badge: 'Professional',
      badgeColor: '#C9302A',
      featured: true,
      popular: true,
      tagline: 'Master the results',
      features: [
        { text: 'Everything in VIP' },
        { text: 'All 6 pillars — Strategy, Accountability, Execution' },
        { text: 'Weekly mastermind' },
        { text: '1:1 time with George' },
        { text: '10% off LIVE events' },
      ],
      callout: 'Weekly mastermind with George, plus 1:1 time. The inner game and the outer game, end to end.',
      cta: 'Go Professional',
      ctaPlanBase: 'pro',
      tierKey: 'pro',
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

  /**
   * Where a card sits relative to the viewer, using ONLY hasTierAccess — never
   * a string compare, so 'pro' outranking 'vip' is decided by the shared rank
   * table rather than by this component.
   *
   *   owned  — this is exactly the viewer's tier → "Current plan", inert CTA
   *   below  — the viewer already outranks it   → "Included", no buy CTA
   *   null   — anonymous, or an upgrade         → normal live CTA
   */
  function ladderState(t: TierDef): 'owned' | 'below' | null {
    return pricingLadderState(currentTier, t.tierKey, hasTierAccess)
  }

  function cataloguePrice(t: TierDef): { monthly: string; annual: string } | null {
    if (t.fixedPrice || !t.priceKey) return null
    const p = pricing[t.priceKey]
    return {
      monthly: `$${p.monthly.toLocaleString('en-US')}`,
      annual: `$${p.annual.toLocaleString('en-US')}`,
    }
  }

  return (
    <div className="ep-pricing-billing">
      <input
        type="radio"
        name="ep-pricing-billing"
        id="ep-pricing-monthly"
        className="sr-only"
        defaultChecked
      />
      <input
        type="radio"
        name="ep-pricing-billing"
        id="ep-pricing-annual"
        className="sr-only"
      />

      {/* Monthly / Annual toggle — CSS :has() flips amounts. No card hydrate. */}
      <div className="flex items-center justify-center gap-2 mb-10" role="radiogroup" aria-label="Billing period">
        <label
          htmlFor="ep-pricing-monthly"
          className="ep-pricing-billing-btn flex items-center gap-2 font-condensed font-bold uppercase tracking-[0.12em] text-[11px] px-5 py-2 rounded transition-all"
        >
          Monthly
        </label>
        <label
          htmlFor="ep-pricing-annual"
          title={ANNUAL_BILLING_TOOLTIP}
          className="ep-pricing-billing-btn flex items-center gap-2 font-condensed font-bold uppercase tracking-[0.12em] text-[11px] px-5 py-2 rounded transition-all"
        >
          Annual
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
        </label>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-20">
        {tiers.map(tier => {
          const catalogue = cataloguePrice(tier)
          const state = ladderState(tier)
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

              {/* Positioning line — what this tier is FOR, in five words. */}
              {tier.tagline && (
                <p
                  className="font-condensed font-bold uppercase tracking-[0.12em] text-[11px] mb-3"
                  style={{ color: tier.badgeColor }}
                >
                  {tier.tagline}
                </p>
              )}

              {/* Price — both periods in HTML; CSS shows the selected one. */}
              <div className="mb-5">
                {tier.fixedPrice ? (
                  <>
                    <span className="font-display font-bold text-3xl" style={{ color: '#F5F0E8' }}>
                      {tier.fixedPrice}
                    </span>
                    {tier.fixedPeriod && (
                      <span className="font-body text-sm ml-1" style={{ color: 'rgba(245,240,232,0.4)' }}>
                        {tier.fixedPeriod}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="ep-price-monthly">
                      <span className="font-display font-bold text-3xl" style={{ color: '#F5F0E8' }}>
                        {catalogue!.monthly}
                      </span>
                      <span className="font-body text-sm ml-1" style={{ color: 'rgba(245,240,232,0.4)' }}>
                        /month
                      </span>
                      <p
                        className="font-condensed uppercase tracking-[0.1em] text-[11px] mt-1.5"
                        style={{ color: '#0ABFA3' }}
                      >
                        {catalogue!.annual}/yr · {ANNUAL_FREE_MONTHS} months free
                      </p>
                    </div>
                    <div className="ep-price-annual">
                      <span className="font-display font-bold text-3xl" style={{ color: '#F5F0E8' }}>
                        {catalogue!.annual}
                      </span>
                      <span className="font-body text-sm ml-1" style={{ color: 'rgba(245,240,232,0.4)' }}>
                        /year
                      </span>
                      <p
                        className="font-condensed uppercase tracking-[0.1em] text-[11px] mt-1.5"
                        style={{ color: '#0ABFA3' }}
                      >
                        {catalogue!.monthly}/mo billed monthly
                      </p>
                    </div>
                  </>
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

              {/* CTA — a plan the viewer already holds never gets a buy button.
                  The server enforces this too (/api/stripe/checkout returns 409);
                  this is the half that stops them clicking in the first place. */}
              {state ? (
                <div
                  aria-disabled="true"
                  className="block w-full py-3 rounded-lg font-condensed font-bold uppercase tracking-[0.1em] text-[12px] text-center"
                  style={{
                    backgroundColor: 'rgba(10,191,163,0.10)',
                    color: 'var(--brand-teal)',
                    border: '1px solid rgba(10,191,163,0.32)',
                    cursor: 'default',
                  }}
                >
                  {state === 'owned' ? 'Current plan' : 'Included'}
                </div>
              ) : tier.ctaPlanBase ? (
                <>
                  <div className="ep-cta-monthly">
                    <PricingCtaButton
                      label={tier.cta}
                      plan={`${tier.ctaPlanBase}_monthly` as const}
                      featured={!!tier.featured}
                    />
                  </div>
                  <div className="ep-cta-annual">
                    <PricingCtaButton
                      label={tier.cta}
                      plan={`${tier.ctaPlanBase}_annual` as const}
                      featured={!!tier.featured}
                    />
                  </div>
                </>
              ) : (
                <PricingCtaButton
                  label={tier.cta}
                  href={tier.ctaHref}
                  featured={!!tier.featured}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
