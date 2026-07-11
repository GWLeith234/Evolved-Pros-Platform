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

/** Brand-red accent for Evolution Partner cards (SPRINT-1). */
export const SPONSOR_RED = '#C9302A'

/**
 * The single sponsor-card presentation, shared by the under-tiles row and the
 * sidebar placement. Red left accent, EVOLUTION PARTNER badge, premium hover.
 */
export function SponsorAdCard({ ad }: { ad: SponsorAd; accent?: string }) {
  const href = [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? null
  const a = SPONSOR_RED
  const name = ad.sponsor_name ?? ad.tool_name ?? 'Sponsor'
  const tagline = ad.headline ?? ad.endorsement_quote ?? name
  const cta = stripTrailingArrow(ad.cta_text ?? 'Learn More')
  const initial = (name[0] ?? 'S').toUpperCase()
  const logoText = truncateOnWord(name, 22)

  const [hover, setHover] = useState(false)

  const inner = (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: 'var(--bg-surface, #111926)',
        border: `1px solid ${hover ? `${a}66` : 'var(--border-color, rgba(255,255,255,0.06))'}`,
        boxShadow: hover
          ? `0 8px 28px rgba(201,48,42,0.14), 0 0 0 1px ${a}22`
          : '0 0 0 transparent',
        padding: '20px 20px 18px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        height: '100%',
        transition: 'border-color 180ms ease, box-shadow 180ms ease, background 180ms ease, transform 180ms ease',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Red accent stripe */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 3,
          background: a,
        }}
      />

      {/* Corner sparkle line on hover */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: hover ? 96 : 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${a})`,
          transition: 'width 220ms ease',
        }}
      />

      {/* EVOLUTION PARTNER badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: a,
            background: hover ? 'rgba(201,48,42,0.14)' : 'rgba(201,48,42,0.08)',
            border: `1px solid ${hover ? 'rgba(201,48,42,0.45)' : 'rgba(201,48,42,0.28)'}`,
            padding: '3px 8px',
            transition: 'background 160ms ease, border-color 160ms ease',
          }}
        >
          Evolution Partner
        </span>
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 8,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary, rgba(255,255,255,0.35))',
          }}
        >
          Sponsored
        </span>
      </div>

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
            color: 'var(--text-primary, #fff)',
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
          color: 'var(--text-primary, rgba(255,255,255,0.95))',
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
          color: hover ? '#FFFFFF' : a,
          background: hover ? a : 'transparent',
          border: `1px solid ${a}`,
          transition: 'color 160ms ease, background 160ms ease',
        }}
      >
        {cta}
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            transform: hover ? 'translateX(3px)' : 'translateX(0)',
            transition: 'transform 160ms ease',
          }}
        >
          →
        </span>
      </div>
    </div>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
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
