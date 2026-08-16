import Link from 'next/link'
import type { Metadata } from 'next'
import { RedeemCodeForm } from './RedeemCodeForm'
import { PricingTierCards } from './PricingTierCards'
import { getMembershipPricing } from '@/lib/commerce/catalogue'
import { LogoMark } from '@/components/ui/LogoMark'
import { tierPlanName } from '@/lib/academy/gating'
import { PILLAR_NAMES } from '@/lib/academy/types'

export const metadata: Metadata = {
  title: 'Pricing — Evolved Pros',
  description: 'Community, VIP, Professional, and Keynote tiers for high performers.',
}

// Amounts are read live from the products + prices catalogue at request time
// (single source of truth), so a price edit reflects without a redeploy.
export const dynamic = 'force-dynamic'

// SPRINT V-CHECKOUT — SKUs surfaced to the client; server validates against
// the matching NEXT_PUBLIC_VENDASTA_MP_* env var in /api/checkout before
// submitting. Names match the Railway-configured marketplace product vars.
const VIP_MONTHLY_SKU = process.env.NEXT_PUBLIC_VENDASTA_MP_VIP_M ?? ''
const PRO_MONTHLY_SKU = process.env.NEXT_PUBLIC_VENDASTA_MP_PRO_M ?? ''

// ── Comparison table ─────────────────────────────────────────────────────────────

type TierSymbol = 'yes' | 'half' | 'no'
interface ComparisonRow {
  label: string
  community: TierSymbol
  vip: TierSymbol
  pro: TierSymbol
}

// SPRINT TIER-1 \u2014 mirrors the approved ladder: the Academy curriculum is the
// only thing gated. Community/events/podcast/media/habits and the assessment
// scores are open to every member, free included.
const COMPARISON: ComparisonRow[] = [
  { label: 'Community feed',                  community: 'yes',  vip: 'yes',  pro: 'yes' },
  { label: 'Podcast & media',                 community: 'yes',  vip: 'yes',  pro: 'yes' },
  { label: 'Events & registration',           community: 'yes',  vip: 'yes',  pro: 'yes' },
  { label: 'Habits / Own the Day',            community: 'yes',  vip: 'yes',  pro: 'yes' },
  { label: 'Pillar Assessment (all 6 scores)', community: 'yes', vip: 'yes',  pro: 'yes' },
  { label: 'Academy Pillar 1: Foundation',    community: 'yes',  vip: 'yes',  pro: 'yes' },
  { label: 'Academy Pillars 2\u20133 (inner game)', community: 'no', vip: 'yes', pro: 'yes' },
  { label: 'Academy Pillars 4\u20136 (outer game)', community: 'no', vip: 'no',  pro: 'yes' },
  { label: 'Full Academy (all 6)',            community: 'no',   vip: 'half', pro: 'yes' },
  { label: 'Assessment breakdown + pillar plan', community: 'no', vip: 'yes',  pro: 'yes' },
  { label: 'Monthly mastermind',              community: 'no',   vip: 'yes',  pro: 'yes' },
  { label: 'Weekly mastermind',               community: 'no',   vip: 'no',   pro: 'yes' },
  { label: '1:1 time with George',            community: 'no',   vip: 'no',   pro: 'yes' },
  { label: '10% off LIVE events',             community: 'no',   vip: 'no',   pro: 'yes' },
]

function SymbolCell({ value }: { value: TierSymbol }) {
  if (value === 'yes') return <span style={{ color: '#0ABFA3', fontWeight: 700 }}>&#10003;</span>
  if (value === 'half') return <span style={{ color: '#C9A84C', fontWeight: 600, fontSize: 11 }}>3 of 6</span>
  return <span style={{ color: 'rgba(245,240,232,0.2)' }}>&ndash;</span>
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
  return (
    <div style={{ backgroundColor: '#0A0F18', minHeight: '100vh' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(245,240,232,0.06)' }}
      >
        {/* Canonical EVOLVED PROS wordmark + red mic — same LogoMark source the
           authenticated TopNav uses (repo asset, height-constrained). This
           public surface is dark-only (see the hard-navy page background), so
           the white `light` variant is correct; no light-mode swap this sprint. */}
        <Link href="/" aria-label="Evolved Pros — home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <LogoMark variant="light" height={32} alt="Evolved Pros" />
        </Link>
        <Link
          href="/login"
          className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] px-4 py-2 rounded transition-opacity hover:opacity-80"
          style={{ color: '#F5F0E8', border: '1px solid rgba(245,240,232,0.15)' }}
        >
          Sign in
        </Link>
      </header>

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

        {/* Tier cards + monthly/annual toggle — amounts from the catalogue. */}
        <PricingTierCards pricing={tiers} vipSku={VIP_MONTHLY_SKU} proSku={PRO_MONTHLY_SKU} />

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
                  {['Community', 'VIP', 'Professional'].map(col => (
                    <th key={col} className="text-center font-condensed font-bold uppercase tracking-[0.14em] text-[9px] pb-4 px-4" style={{ color: 'rgba(245,240,232,0.5)' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
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
                    {(['community', 'vip', 'pro'] as const).map(col => (
                      <td
                        key={col}
                        className="text-center text-[15px] py-3 px-4"
                        style={{
                          borderTop: i === 0 ? 'none' : '1px solid rgba(245,240,232,0.06)',
                        }}
                      >
                        <SymbolCell value={row[col]} />
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
  )
}
