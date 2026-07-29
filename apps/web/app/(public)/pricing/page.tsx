import Link from 'next/link'
import type { Metadata } from 'next'
import { RedeemCodeForm } from './RedeemCodeForm'
import { PricingTierCards } from './PricingTierCards'
import { getMembershipPricing } from '@/lib/commerce/catalogue'
import { LogoMark } from '@/components/ui/LogoMark'

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

const COMPARISON: ComparisonRow[] = [
  { label: 'Community feed',       community: 'yes',  vip: 'yes',  pro: 'yes' },
  { label: 'Podcast',              community: 'yes',  vip: 'yes',  pro: 'yes' },
  { label: 'Event discovery',      community: 'yes',  vip: 'yes',  pro: 'yes' },
  { label: 'Event registration',   community: 'no',   vip: 'yes',  pro: 'yes' },
  { label: 'Academy Pillars 1\u20133', community: 'no',   vip: 'yes',  pro: 'yes' },
  { label: 'Full Academy (all 6)', community: 'no',   vip: 'half', pro: 'yes' },
  { label: 'Own the Day',          community: 'no',   vip: 'yes',  pro: 'yes' },
  { label: 'Accountability (your #1 goal)',  community: 'no',   vip: 'no',   pro: 'yes' },
  { label: 'Bi-weekly mastermind', community: 'no',   vip: 'no',   pro: 'yes' },
]

function SymbolCell({ value }: { value: TierSymbol }) {
  if (value === 'yes') return <span style={{ color: '#0ABFA3', fontWeight: 700 }}>&#10003;</span>
  if (value === 'half') return <span style={{ color: '#C9A84C', fontWeight: 600, fontSize: 11 }}>3 of 6</span>
  return <span style={{ color: 'rgba(245,240,232,0.2)' }}>&ndash;</span>
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PricingPage() {
  // Amounts sourced from the products + prices catalogue (single source of
  // truth). getMembershipPricing falls back to the canonical lib/pricing
  // constants per amount if the catalogue query fails or is empty.
  const { tiers } = await getMembershipPricing()
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
            Pricing
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl mb-4" style={{ color: '#F5F0E8' }}>
            Invest in your evolution.
          </h1>
          <p className="font-body text-sm max-w-lg mx-auto" style={{ color: 'rgba(245,240,232,0.5)' }}>
            Every tier unlocks more of the EVOLVED system. Start free, upgrade when you're ready.
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
