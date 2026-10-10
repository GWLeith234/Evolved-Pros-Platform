import Link from 'next/link'
import type { Metadata } from 'next'
import nextDynamic from 'next/dynamic'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { effectiveTier } from '@/lib/tier'
import { getMembershipPricing } from '@/lib/commerce/catalogue'
import { tierPlanName } from '@/lib/academy/gating'
import { PILLAR_NAMES } from '@/lib/academy/types'
import { pricingComparisonRows, TIER_LABELS, type TierKeyName } from '@/lib/entitlements'
import { PRICING_META_DESCRIPTION } from '@/lib/pricing'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { pricingJsonLd } from '@/lib/seo/jsonld'
import { MUST_CITE_PRICING_DIFFERENTIATOR } from '@/lib/seo/mustCite'
import { PricingTierCards } from './PricingTierCards'

const RedeemCodeForm = nextDynamic(
  () => import('./RedeemCodeForm').then(m => m.RedeemCodeForm),
  {
    loading: () => (
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: '#111926',
          border: '1px solid rgba(245,240,232,0.08)',
          minHeight: 168,
        }}
        aria-hidden
      />
    ),
  },
)

export const metadata: Metadata = publicPageMetadata('/pricing', {
  title: 'Pricing | Evolved Pros',
  description: PRICING_META_DESCRIPTION,
})

// Amounts are read live from the products + prices catalogue at request time
// (single source of truth), so a price edit reflects without a redeploy.
export const dynamic = 'force-dynamic'

// Comparison rows are built from ENTITLEMENTS in the page body. A hand-kept
// yes/no array drifted (weekly mastermind, 1:1, "3 of 6").

function CellText({ value }: { value: string }) {
  const quiet = value === 'Not included' || value === 'None'
  return (
    <span style={{ color: quiet ? 'rgba(245,240,232,0.28)' : '#F5F0E8', fontWeight: quiet ? 500 : 600, fontSize: 13 }}>
      {value}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

/**
 * SPRINT TIER-1 — contextual headline.
 *
 * Locked Academy cards, the pillar lock panel, the assessment banner and the
 * events chips all link here with ?from=…&pillar=…&tier=…. Honouring those
 * params means a member who bounced off Mental Toughness lands on "Unlock
 * Mental Toughness with VIP" rather than a generic ladder.
 *
 * COPY ONLY. No checkout state is derived from these params — the CTA buttons
 * and SKUs below are identical whether or not they are present. Params come
 * from a URL a stranger can edit, so every value is validated against a known
 * set before it reaches the page.
 */
function contextualHero(searchParams: Record<string, string | string[] | undefined>): {
  eyebrow: string
  title: string
  sub: string
} {
  const one = (v: string | string[] | undefined): string =>
    (Array.isArray(v) ? v[0] : v ?? '').toLowerCase()

  const from = one(searchParams.from)
  const tierParam = one(searchParams.tier)
  const tier = tierParam === 'vip' || tierParam === 'pro' ? tierParam : null
  const planName = tier ? tierPlanName(tier) : null

  const pillarNum = Number.parseInt(one(searchParams.pillar), 10)
  const pillarName =
    Number.isInteger(pillarNum) && pillarNum >= 1 && pillarNum <= 6
      ? PILLAR_NAMES[pillarNum]
      : null

  const DEFAULT = {
    eyebrow: 'Pricing',
    title: 'Invest in your evolution.',
    sub: 'Everything but the curriculum is free. The Academy is what you upgrade for.',
  }

  if (from === 'academy' || from === 'assessment') {
    if (pillarName && planName) {
      return {
        eyebrow: from === 'assessment' ? 'Your weakest pillar' : 'The Academy',
        title: `Unlock ${pillarName} with ${planName}.`,
        sub:
          from === 'assessment'
            ? `${pillarName} scored lowest in your assessment. ${planName} opens it.`
            : `Pillar ${pillarNum} is part of ${planName}. Your progress in the open pillars carries over.`,
      }
    }
    if (planName) {
      return {
        eyebrow: 'The Academy',
        title: `Unlock the Academy with ${planName}.`,
        sub: 'Pillar 1 is free forever. The rest of the curriculum comes with a plan.',
      }
    }
  }

  if (from === 'events') {
    return {
      eyebrow: 'Events',
      title: planName ? `That session is ${planName}.` : 'Get into every session.',
      sub: 'Event discovery and registration are free. Masterminds come with a plan.',
    }
  }

  if (from === 'fit') {
    return {
      eyebrow: 'Instructional guides',
      title: 'Unlock the Fit library with VIP.',
      sub: 'Hip-aware video guides for 55+. Phone, iPad, or cast to TV. Full programs unlock at VIP.',
    }
  }

  return DEFAULT
}

interface PricingPageProps {
  searchParams?: Record<string, string | string[] | undefined>
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  // Amounts sourced from the products + prices catalogue (single source of
  // truth). getMembershipPricing falls back to the canonical lib/pricing
  // constants per amount if the catalogue query fails or is empty.
  const { tiers } = await getMembershipPricing()
  const hero = contextualHero(searchParams ?? {})
  const comparison = pricingComparisonRows({
    community: tiers.community.monthly,
    vip: tiers.vip.monthly,
    pro: tiers.professional.monthly,
  })
  const columns: TierKeyName[] = ['community', 'vip', 'pro']

  // SPRINT PRICE-1 — who is looking at this page?
  //
  // This page stays PUBLIC: resolveCurrentUser returns null for an anonymous
  // visitor and we render the logged-out state. It must never redirect. The
  // session is refreshed by middleware (/pricing is in SESSION_OPTIONAL_ROUTES
  // and in config.matcher), so a member with a stale access token still reads
  // as signed in rather than being shown a buy button for a plan they own.
  let profile: Awaited<ReturnType<typeof resolveCurrentUser>> = null
  try {
    profile = await resolveCurrentUser()
  } catch {
    // Public page. A failed session lookup renders the anonymous ladder.
    profile = null
  }
  const currentTier = profile
    ? effectiveTier(
        (profile as unknown as { tier?: string | null }).tier,
        (profile as unknown as { tier_status?: string | null }).tier_status,
      )
    : null
  // Header chrome lives in ./layout.tsx (TopNav + account menu when signed
  // in, Sign in when anonymous). Do not add a second SIGN IN control here.
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd()) }}
      />
    <div style={{ backgroundColor: '#0A0F18', minHeight: '100%' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[10px] mb-3" style={{ color: '#C9A84C' }}>
            {hero.eyebrow}
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl mb-4" style={{ color: '#F5F0E8' }}>
            {hero.title}
          </h1>
          <p className="font-body text-sm max-w-lg mx-auto" style={{ color: 'rgba(245,240,232,0.5)' }}>
            {hero.sub}
          </p>
        </div>

        <section
          id="pricing-differentiator"
          className="max-w-3xl mx-auto mb-16 text-center"
        >
          <h2
            className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] mb-4"
            style={{ color: 'rgba(245,240,232,0.4)' }}
          >
            Why Evolved Pros
          </h2>
          <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>
            {MUST_CITE_PRICING_DIFFERENTIATOR}
          </p>
        </section>

        {/* Tier cards + monthly/annual toggle — amounts from the catalogue. */}
        <PricingTierCards
          pricing={tiers}
          currentTier={currentTier}
        />

        {/* Have a code? — comp / access-code redemption (Friends of George). */}
        <div className="max-w-2xl mx-auto mb-20">
          <RedeemCodeForm />
        </div>

        {/* Comparison table */}
        <div className="mb-16">
          <h2 className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] text-center mb-8" style={{ color: 'rgba(245,240,232,0.4)' }}>
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-3xl mx-auto" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th className="text-left font-condensed font-bold uppercase tracking-[0.14em] text-[9px] pb-4 pr-4" style={{ color: 'rgba(245,240,232,0.3)' }}>
                    Feature
                  </th>
                  {columns.map(col => (
                    <th key={col} className="text-center font-condensed font-bold uppercase tracking-[0.14em] text-[9px] pb-4 px-4" style={{ color: 'rgba(245,240,232,0.5)' }}>
                      {TIER_LABELS[col]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.label}>
                    <td
                      className="font-body text-[13px] py-3 pr-4"
                      style={{
                        color: 'rgba(245,240,232,0.6)',
                        borderTop: i === 0 ? 'none' : '1px solid rgba(245,240,232,0.06)',
                      }}
                    >
                      {row.label}
                    </td>
                    {columns.map(col => (
                      <td
                        key={col}
                        className="text-center text-[15px] py-3 px-4"
                        style={{
                          borderTop: i === 0 ? 'none' : '1px solid rgba(245,240,232,0.06)',
                        }}
                      >
                        <CellText value={row.cells[col]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center">
          <p className="font-body text-sm mb-4" style={{ color: 'rgba(245,240,232,0.4)' }}>
            Questions? Reach out and we&rsquo;ll get back to you.
          </p>
          <Link
            href="mailto:support@evolvedpros.com?subject=Pricing%20question%20-%20Evolved%20Pros"
            className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] px-5 py-2.5 rounded transition-opacity hover:opacity-80"
            style={{ color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
    </>
  )
}
