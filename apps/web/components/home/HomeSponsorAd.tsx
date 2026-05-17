'use client'

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

// Pillar-rotation accent palette mirrors the home SponsorRail design.
const ACCENTS = ['#3FB8E8', '#E8B547', '#A78BFA']

export function HomeSponsorAd() {
  const [ad, setAd] = useState<SponsorAd | null>(null)

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const tryQuery = (q: any) => q.eq('is_active', true).order('sort_order').limit(1).maybeSingle()
      // Prefer ads tagged for /home or 'all'; fall back to any active ad.
      const primary = await tryQuery(
        sb.from('platform_ads')
          .select('id, image_url, click_url, link_url, headline, tool_name, sponsor_name, cta_text, endorsement_quote')
          .in('placement', ['home', 'all'])
      )
      if (primary.data) { setAd(primary.data); return }
      const fallback = await tryQuery(
        sb.from('platform_ads')
          .select('id, image_url, click_url, link_url, headline, tool_name, sponsor_name, cta_text, endorsement_quote')
      )
      if (fallback.data) setAd(fallback.data)
    })()
  }, [])

  if (!ad) return null

  const href = [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? null
  const accent = ACCENTS[(ad.id.charCodeAt(0) ?? 0) % ACCENTS.length]
  const name = ad.sponsor_name ?? ad.tool_name ?? 'Sponsor'
  const tagline = ad.headline ?? ad.endorsement_quote ?? name
  const cta = ad.cta_text ?? 'Learn More'
  const initial = (name[0] ?? 'S').toUpperCase()
  const logoText = name.toUpperCase().slice(0, 14)

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
          background: accent,
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
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 18,
              letterSpacing: '0.04em',
            }}
          >
            {initial}
          </div>
        )}
        <span
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 18,
            letterSpacing: '0.14em',
            color: '#fff',
            textTransform: 'uppercase',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
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

      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
          {inner}
        </a>
      ) : (
        inner
      )}
    </section>
  )
}
