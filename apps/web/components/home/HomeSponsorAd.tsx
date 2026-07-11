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
 * Centered premium Evolution Partner card — shared by the under-tiles row and
 * the sidebar placement. Red badge, red CTA, soft scale hover.
 */
export function SponsorAdCard({ ad }: { ad: SponsorAd; accent?: string }) {
  const href = [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? null
  const name = ad.sponsor_name ?? ad.tool_name ?? 'Evolution Partner'
  const tagline = ad.headline ?? ad.endorsement_quote ?? name
  const cta = stripTrailingArrow(ad.cta_text ?? 'Learn More')
  const initial = (name[0] ?? 'E').toUpperCase()

  const card = (
    <div
      className="relative flex h-full flex-col rounded-2xl border border-red/30 bg-zinc-900 p-6 pt-8 transition-all duration-300 group-hover:scale-[1.02] group-hover:border-red/50 group-hover:shadow-2xl group-hover:shadow-red/10"
      style={{
        // Brand red (#C9302A) for border tokens that Tailwind red/* can't hit exactly
        borderColor: 'rgba(201,48,42,0.30)',
        background: '#111926',
      }}
    >
      {/* Evolution Partner Badge */}
      <div
        className="absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-medium tracking-widest text-white"
        style={{
          backgroundColor: SPONSOR_RED,
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 800,
          letterSpacing: '0.18em',
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
          <div
            className="flex h-20 w-20 items-center justify-center rounded-xl text-4xl"
            style={{
              backgroundColor: 'rgba(201,48,42,0.10)',
              color: SPONSOR_RED,
              fontFamily: '"Bebas Neue", sans-serif',
            }}
          >
            {initial}
          </div>
        )}

        <div>
          <h4
            className="text-xl font-semibold text-white"
            style={{ fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.04em' }}
          >
            {name}
          </h4>
          <p
            className="mt-2 text-sm leading-relaxed text-zinc-400"
            style={{ fontFamily: '"Barlow", sans-serif' }}
          >
            {tagline}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-6">
        <div
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition-colors"
          style={{
            backgroundColor: SPONSOR_RED,
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
