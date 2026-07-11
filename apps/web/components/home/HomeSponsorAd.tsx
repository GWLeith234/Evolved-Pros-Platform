'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { stripTrailingArrow } from '@/lib/brand'

export type SponsorAd = {
  id: string
  image_url: string | null
  click_url: string | null
  link_url: string | null
  headline: string | null
  tool_name: string | null
  sponsor_name: string | null
  cta_text: string | null
  endorsement_quote: string | null
}

export const SPONSOR_AD_COLUMNS =
  'id, image_url, click_url, link_url, headline, tool_name, sponsor_name, cta_text, endorsement_quote'

/** Brand-red accent for Evolution Partner cards (SPRINT-1). */
export const SPONSOR_RED = '#C9302A'

/**
 * Red microphone disc — the Evolved Pros brand glyph. Used as the logo
 * fallback when a partner has no image, so the placement still reads as an
 * Evolution Partner card rather than a bare initial.
 */
function MicGlyph() {
  return (
    <span
      className="flex h-20 w-20 items-center justify-center rounded-2xl"
      style={{ backgroundColor: 'rgba(201,48,42,0.10)' }}
      aria-hidden
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={SPONSOR_RED} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2" width="6" height="12" rx="3" fill={SPONSOR_RED} stroke="none" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <line x1="8" y1="21" x2="16" y2="21" />
      </svg>
    </span>
  )
}

/**
 * Centered premium Evolution Partner card — shared by the under-tiles row and
 * the sidebar placement. Red badge, red mic glyph, red CTA, and a soft
 * scale + red-glow hover driven ENTIRELY by Tailwind `group-hover` utilities
 * (no onMouseEnter/onMouseLeave, no local state), so the card is purely
 * presentational and safe to render from Server Components / during static
 * generation — passing event handlers to a client-component boundary is what
 * tripped the "Event handlers cannot be passed to Client Component props"
 * build error. Every surface/text color binds to a theme token so the card
 * reads identically in dark and light modes (SPRINT-1); the red accents are
 * the only fixed brand colors, so they stand out without overwhelming the
 * neutral card body.
 */
export function SponsorAdCard({ ad }: { ad: SponsorAd; accent?: string }) {
  const href = [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? null
  const name = ad.sponsor_name ?? ad.tool_name ?? 'Evolution Partner'
  const tagline = ad.headline ?? ad.endorsement_quote ?? name
  const cta = stripTrailingArrow(ad.cta_text ?? 'Learn More')

  const card = (
    <div className="relative flex h-full flex-col rounded-2xl border border-red/30 bg-surface p-6 pt-8 shadow-sm transition-all duration-300 group-hover:scale-[1.02] group-hover:border-red/60 group-hover:shadow-2xl group-hover:shadow-red/20">
      {/* Evolution Partner Badge */}
      <div
        className="absolute -top-3 right-6 rounded-full px-3 py-1 text-xs text-white"
        style={{
          backgroundColor: SPONSOR_RED,
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 800,
          letterSpacing: '0.18em',
          boxShadow: '0 2px 8px rgba(201,48,42,0.35)',
        }}
      >
        EVOLUTION PARTNER
      </div>

      <div className="flex flex-1 flex-col items-center justify-center space-y-6 text-center">
        {ad.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.image_url}
            alt={name}
            className="h-20 w-auto object-contain opacity-90 transition-opacity group-hover:opacity-100"
          />
        ) : (
          <MicGlyph />
        )}

        <div>
          <h4
            className="text-xl font-semibold text-primary"
            style={{ fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.04em' }}
          >
            {name}
          </h4>
          <p
            className="mt-2 text-sm leading-relaxed text-secondary"
            style={{ fontFamily: '"Barlow", sans-serif' }}
          >
            {tagline}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red px-6 py-3 text-sm text-white transition-colors group-hover:bg-[#b12923]"
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {cta}
          <span aria-hidden>→</span>
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group block h-full pt-3 no-underline"
      >
        {card}
      </a>
    )
  }

  return <div className="group h-full pt-3">{card}</div>
}

/** Shared "Sponsored" eyebrow + divider used above each sponsor placement. */
export function SponsoredEyebrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <span
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          fontSize: 9,
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary, rgba(255,255,255,0.42))',
          padding: '3px 8px',
          border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
        }}
      >
        Sponsored
      </span>
      <span
        style={{
          flex: 1,
          height: 1,
          background: 'var(--border-color, rgba(255,255,255,0.06))',
        }}
      />
      <span
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 600,
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary, rgba(255,255,255,0.3))',
        }}
      >
        Evolution Partners
      </span>
    </div>
  )
}

/**
 * Sidebar sponsor placement: a single ad. Prefers a `sidebar`-tagged ad so it
 * does not collide with the under-tiles row (which pulls `home`/`all`); falls
 * back to any active ad. Renders through the shared SponsorAdCard.
 */
export function HomeSponsorAd() {
  const [ad, setAd] = useState<SponsorAd | null>(null)

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const tryQuery = (q: any) => q.eq('is_active', true).order('sort_order').limit(1).maybeSingle()
      const primary = await tryQuery(
        sb.from('platform_ads').select(SPONSOR_AD_COLUMNS).in('placement', ['sidebar', 'all']),
      )
      if (primary.data) { setAd(primary.data); return }
      const fallback = await tryQuery(sb.from('platform_ads').select(SPONSOR_AD_COLUMNS))
      if (fallback.data) setAd(fallback.data)
    })()
  }, [])

  if (!ad) return null

  return (
    <section aria-label="Sponsored">
      <SponsoredEyebrow />
      <SponsorAdCard ad={ad} />
    </section>
  )
}
