'use client'

// SPRINT M — two-card sponsor row. Sits below the 4-up tile grid on
// /home. Each card has a 4px left accent border (teal + gold in this
// rotation), a tool-initial badge, headline, description, and CTA.
// Mount-gates rendering until after first effect so the server emits a
// stable empty section and we can't trip a hydration mismatch when the
// ads themselves arrive asynchronously.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type SponsorAd = {
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

const ACCENTS = ['#0ABFA3', '#C9A84C'] as const // teal, gold

function SponsorCard({ ad, accent }: { ad: SponsorAd; accent: string }) {
  const href = [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? null
  const name = ad.sponsor_name ?? ad.tool_name ?? 'Sponsor'
  const tagline = ad.headline ?? ad.endorsement_quote ?? name
  const description = ad.endorsement_quote && ad.endorsement_quote !== tagline
    ? ad.endorsement_quote
    : null
  const cta = ad.cta_text ?? 'Learn More'
  const initial = (name[0] ?? 'S').toUpperCase()
  const logoText = name.toUpperCase().slice(0, 20)

  const inner = (
    <div
      style={{
        position: 'relative',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        padding: '20px 20px 18px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
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
          width: 4,
          background: accent,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {ad.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.image_url}
            alt={name}
            style={{
              width: 36,
              height: 36,
              objectFit: 'cover',
              border: `1px solid ${accent}55`,
              background: `${accent}1a`,
            }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              background: `${accent}1a`,
              border: `1px solid ${accent}55`,
              color: accent,
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
            fontSize: 17,
            letterSpacing: '0.14em',
            color: 'var(--text-primary)',
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
          color: 'var(--text-primary)',
        }}
      >
        {tagline}
      </p>

      {description && (
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            lineHeight: 1.5,
            color: 'var(--text-tertiary)',
          }}
        >
          {description}
        </p>
      )}

      <div
        style={{
          marginTop: 4,
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
          color: accent,
          background: 'transparent',
          border: `1px solid ${accent}`,
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

export function HomeSponsorRow() {
  const [mounted, setMounted] = useState(false)
  const [ads, setAds] = useState<SponsorAd[]>([])

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    void (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const cols = 'id, image_url, click_url, link_url, headline, tool_name, sponsor_name, cta_text, endorsement_quote'
      const primary = await sb
        .from('platform_ads')
        .select(cols)
        .eq('is_active', true)
        .in('placement', ['home', 'all'])
        .order('sort_order')
        .limit(2)
      const rows = (primary.data ?? []) as SponsorAd[]
      if (rows.length < 2) {
        const fallback = await sb
          .from('platform_ads')
          .select(cols)
          .eq('is_active', true)
          .order('sort_order')
          .limit(2)
        const seen = new Set(rows.map(r => r.id))
        for (const r of (fallback.data ?? []) as SponsorAd[]) {
          if (rows.length >= 2) break
          if (!seen.has(r.id)) rows.push(r)
        }
      }
      setAds(rows.slice(0, 2))
    })()
  }, [])

  if (!mounted || ads.length === 0) return null

  return (
    <section aria-label="Sponsored">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
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
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }}
      >
        {ads.map((ad, i) => (
          <SponsorCard key={ad.id} ad={ad} accent={ACCENTS[i % ACCENTS.length]} />
        ))}
      </div>
    </section>
  )
}
