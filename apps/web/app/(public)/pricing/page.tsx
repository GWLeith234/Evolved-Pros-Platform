import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Evolved Pros',
  description: 'Community, VIP, Professional, and Keynote tiers for high performers.',
}

<<<<<<< HEAD
// ── Tier data ────────────────────────────────────────────────────────────────────
=======
// ── Tier data ──────────────────────────────────────────────────────────────
>>>>>>> origin/claude/init-evolved-pros-platform-Q2oUw

interface Feature { text: string; locked?: boolean }

interface Tier {
  name: string
  price: string
  period?: string
  badge: string
  badgeColor: string
  featured?: boolean
  popular?: boolean
  keynote?: boolean
  features: Feature[]
  callout?: string
  cta: string
  ctaHref: string
}

const TIERS: Tier[] = [
  {
    name: 'Community',
    price: 'Free',
    period: 'forever',
    badge: 'Community',
    badgeColor: '#60A5FA',
    features: [
      { text: 'Community feed' },
      { text: 'Podcast library' },
      { text: 'Event discovery' },
      { text: 'Academy', locked: true },
      { text: 'Discipline board', locked: true },
      { text: 'Scoreboard', locked: true },
    ],
    cta: 'Join free',
    ctaHref: '/login?mode=signup',
  },
  {
    name: 'VIP',
<<<<<<< HEAD
    price: '$49',
=======
    price: '$79',
>>>>>>> origin/claude/init-evolved-pros-platform-Q2oUw
    period: '/month',
    badge: 'VIP',
    badgeColor: '#C9A84C',
    features: [
      { text: 'Everything in Community' },
      { text: 'Event registration' },
      { text: 'Academy Pillars 1\u20133' },
      { text: 'Discipline board' },
      { text: 'Scoreboard + WIG (your #1 goal)', locked: true },
      { text: 'Academy Pillars 4\u20136', locked: true },
    ],
    cta: 'Start VIP',
    ctaHref: '#vendasta-vip',
  },
  {
    name: 'Professional',
    price: '$249',
    period: '/month',
    badge: 'Professional',
    badgeColor: '#C9302A',
    featured: true,
    popular: true,
    features: [
      { text: 'Everything in VIP' },
      { text: 'Full 6-Pillar Academy' },
      { text: 'Scoreboard + WIG system' },
      { text: 'Priority events' },
    ],
    callout: 'Bi-weekly 1hr mastermind with George. Topics rotate through all 6 EVOLVED pillars.',
    cta: 'Go Professional',
    ctaHref: '#vendasta-pro',
  },
  {
    name: 'Keynotes',
    price: 'Inquire',
    period: 'for fee',
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

<<<<<<< HEAD
// ── Comparison table ─────────────────────────────────────────────────────────────
=======
// ── Comparison table ───────────────────────────────────────────────────────
>>>>>>> origin/claude/init-evolved-pros-platform-Q2oUw

type Symbol = 'yes' | 'half' | 'no'
interface ComparisonRow {
  label: string
  community: Symbol
  vip: Symbol
  pro: Symbol
}

const COMPARISON: ComparisonRow[] = [
  { label: 'Community feed',       community: 'yes',  vip: 'yes',  pro: 'yes' },
  { label: 'Podcast',              community: 'yes',  vip: 'yes',  pro: 'yes' },
  { label: 'Event discovery',      community: 'yes',  vip: 'yes',  pro: 'yes' },
  { label: 'Event registration',   community: 'no',   vip: 'yes',  pro: 'yes' },
  { label: 'Academy Pillars 1\u20133', community: 'no',   vip: 'yes',  pro: 'yes' },
  { label: 'Full Academy (all 6)', community: 'no',   vip: 'half', pro: 'yes' },
  { label: 'Discipline board',     community: 'no',   vip: 'yes',  pro: 'yes' },
  { label: 'Scoreboard + WIG (your #1 goal)',  community: 'no',   vip: 'no',   pro: 'yes' },
  { label: 'Bi-weekly mastermind', community: 'no',   vip: 'no',   pro: 'yes' },
]

function SymbolCell({ value }: { value: Symbol }) {
  if (value === 'yes') return <span style={{ color: '#0ABFA3', fontWeight: 700 }}>&#10003;</span>
  if (value === 'half') return <span style={{ color: '#C9A84C', fontWeight: 600, fontSize: 11 }}>3 of 6</span>
  return <span style={{ color: 'rgba(245,240,232,0.2)' }}>&ndash;</span>
}

<<<<<<< HEAD
// ── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div style={{ backgroundColor: '#0A0F18', minHeight: '100vh' }}>
=======
// ── From= banner messages ──────────────────────────────────────────────────

const FROM_MESSAGES: Record<string, { tier: string; feature: string }> = {
  discipline: { tier: 'VIP', feature: 'the Discipline board' },
  scoreboard: { tier: 'Professional', feature: 'Scoreboards' },
  academy:    { tier: 'VIP', feature: 'the Academy' },
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PricingPage({ searchParams }: { searchParams: { from?: string } }) {
  const fromMsg = searchParams.from ? FROM_MESSAGES[searchParams.from] : null

  return (
    <div style={{ backgroundColor: '#0A0F18', minHeight: '100vh' }}>
      {/* From= upgrade banner */}
      {fromMsg && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-3 text-[13px] font-body"
          style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#C9A84C', borderBottom: '1px solid rgba(201,168,76,0.15)' }}
        >
          You need <strong>{fromMsg.tier}</strong> to access {fromMsg.feature}.
        </div>
      )}

>>>>>>> origin/claude/init-evolved-pros-platform-Q2oUw
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(245,240,232,0.06)' }}
      >
        <Link href="/" className="font-condensed font-bold tracking-[0.18em] text-[14px]" style={{ color: '#F5F0E8', textDecoration: 'none' }}>
          EVOLVED<span style={{ color: '#C9302A' }}>&middot;</span>PROS
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

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-20">
          {TIERS.map(tier => (
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
                  <span className="font-condensed font-bold uppercase tracking-[0.1em] text-[8px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,48,42,.1)', color: '#C9302A' }}>
                    Most popular
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mb-5">
                <span className="font-display font-bold text-3xl" style={{ color: '#F5F0E8' }}>
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="font-body text-sm ml-1" style={{ color: 'rgba(245,240,232,0.4)' }}>
                    {tier.period}
                  </span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {tier.features.map(f => (
                  <li key={f.text} className="flex items-start gap-2 text-[13px] font-body" style={{ color: f.locked ? 'rgba(245,240,232,0.25)' : 'rgba(245,240,232,0.7)' }}>
                    <span className="mt-0.5 flex-shrink-0" style={{ color: f.locked ? 'rgba(245,240,232,0.15)' : '#0ABFA3' }}>
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
                  <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[9px] mb-1.5" style={{ color: '#C9302A' }}>
                    Mastermind
                  </p>
                  <p className="font-body text-[12px] leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>
                    {tier.callout}
                  </p>
                </div>
              )}

              {/* CTA */}
              <Link
                href={tier.ctaHref}
                className="block w-full py-3 rounded-lg font-condensed font-bold uppercase tracking-[0.1em] text-[12px] text-center transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: tier.featured ? '#C9302A' : 'rgba(245,240,232,0.06)',
                  color: tier.featured ? '#fff' : '#F5F0E8',
                  border: tier.featured ? 'none' : '1px solid rgba(245,240,232,0.1)',
                }}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
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
            Questions? Reach out to George directly.
          </p>
          <Link
            href="mailto:geoleith@gmail.com"
            className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] px-5 py-2.5 rounded transition-opacity hover:opacity-80"
            style={{ color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
          >
            Contact George
          </Link>
        </div>
      </div>
    </div>
  )
}
