'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { stripTrailingArrow, truncateOnWord } from '@/lib/brand'

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

// One accent rule for every sponsor placement (A6.2). Pillar-palette tokens,
// rotated deterministically by id so the row's two cards differ but a given ad
// always renders the same accent. Tokens mirror lib/pillar-colors.ts.
const SPONSOR_ACCENTS = ['#3FB8E8', '#E8B547', '#A78BFA'] as const

export function sponsorAccent(id: string): string {
  return SPONSOR_ACCENTS[(id.charCodeAt(0) || 0) % SPONSOR_ACCENTS.length]
}

/**
 * The single sponsor-card presentation, shared by the under-tiles row and the
 * sidebar placement. One CTA rule (`<label> →`, single arrow — any arrow the
 * stored label already carries is stripped first), one accent rule.
 */
export function SponsorAdCard({ ad, accent }: { ad: SponsorAd; accent?: string }) {
  const href = [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? null
  const a = accent ?? sponsorAccent(ad.id)
  const name = ad.sponsor_name ?? ad.tool_name ?? 'Sponsor'
  const tagline = ad.headline ?? ad.endorsement_quote ?? name
  // CTA: strip any arrow the stored label already contains, then append exactly
  // one. Without the strip, a DB label ending in an arrow renders a doubled
  // arrow in the CTA. See stripTrailingArrow in lib/brand.
  const cta = stripTrailingArrow(ad.cta_text ?? 'Learn More')
  const initial = (name[0] ?? 'S').toUpperCase()
  // Word-boundary ellipsis — never mid-word ("EVOLVED — GEOR"). Uppercasing is
  // a CSS concern (text-transform below), so truncate the cased source.
  const logoText = truncateOnWord(name, 22)

  const inner = (
    <div
      style={{
        position: 'relative',
        background: '#111926',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 20px 18px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        height: '100%',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 2,
          background: a,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        {ad.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.image_url}
            alt={name}
            style={{
              width: 36,
              height: 36,
              objectFit: 'cover',
              border: `1px solid ${a}55`,
              background: `${a}1a`,
            }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              background: `${a}1a`,
              border: `1px solid ${a}55`,
              color: a,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 18,
              letterSpacing: '0.04em',
            }}
          >
            {initial}
          </div>
        )}
        <span
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 18,
            letterSpacing: '0.14em',
            color: '#fff',
            textTransform: 'uppercase',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}
        >
          {logoText}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: 16,
          lineHeight: 1.3,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.95)',
        }}
      >
        {tagline}
      </p>
      <div
        style={{
          marginTop: 14,
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 14px',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 800,
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: a,
          background: 'transparent',
          border: `1px solid ${a}`,
        }}
      >
        {cta}
        <span aria-hidden>→</span>
      </div>
    </div>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', textDecoration: 'none', height: '100%' }}
      >
        {inner}
      </a>
    )
  }
  return inner
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
          color: 'rgba(255,255,255,0.42)',
          padding: '3px 8px',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        Sponsored
      </span>
      <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
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
