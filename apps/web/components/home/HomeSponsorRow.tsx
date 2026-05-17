// SPRINT-M Section 2 — 2-up sponsor row that sits below the 4-up tile grid.
// Server component: fetches up to 2 active rows from `platform_ads` and
// renders each as a card with a 4px left accent (teal / gold), a
// tool-initial square badge, a headline + 2-line body, and an outlined
// CTA. If no ads are returned the row renders nothing so the layout
// stays tight instead of leaking blank cards.

import { adminClient } from '@/lib/supabase/admin'

const ACCENTS = ['#0ABFA3', '#C9A84C'] as const

interface SponsorAdRow {
  id: string
  tool_name: string | null
  sponsor_name: string | null
  headline: string | null
  body_copy: string | null
  endorsement_quote: string | null
  cta_text: string | null
  link_url: string | null
  click_url: string | null
  image_url: string | null
}

function initialFor(ad: SponsorAdRow): string {
  const name = ad.tool_name ?? ad.sponsor_name ?? ''
  return (name.trim()[0] ?? '·').toUpperCase()
}

function hrefFor(ad: SponsorAdRow): string | null {
  return [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? null
}

function bodyFor(ad: SponsorAdRow): string {
  return ad.body_copy ?? ad.endorsement_quote ?? ''
}

async function fetchSponsorAds(): Promise<SponsorAdRow[]> {
  try {
    const { data } = await adminClient
      .from('platform_ads')
      .select('id, tool_name, sponsor_name, headline, body_copy, endorsement_quote, cta_text, link_url, click_url, image_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(2)
    return (data ?? []) as SponsorAdRow[]
  } catch {
    return []
  }
}

export async function HomeSponsorRow() {
  const ads = await fetchSponsorAds()
  if (ads.length === 0) return null

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }}
    >
      {ads.map((ad, idx) => {
        const accent = ACCENTS[idx % ACCENTS.length]
        const href = hrefFor(ad)
        const headline = ad.headline ?? ad.tool_name ?? 'Sponsored'
        const body = bodyFor(ad)
        const cta = ad.cta_text ?? 'Learn more →'

        const card = (
          <article
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderLeft: `4px solid ${accent}`,
              padding: '18px 20px',
              minHeight: 132,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${accent}1A`,
                  border: `1px solid ${accent}55`,
                  color: accent,
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 20,
                  letterSpacing: '0.04em',
                }}
              >
                {initialFor(ad)}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 700,
                    fontSize: 9,
                    letterSpacing: '0.32em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Sponsored
                </p>
                <h3
                  style={{
                    margin: '2px 0 0',
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: 18,
                    letterSpacing: '0.04em',
                    color: 'var(--text-primary)',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {headline}
                </h3>
              </div>
            </div>

            {body && (
              <p
                style={{
                  margin: 0,
                  fontFamily: '"Barlow", sans-serif',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {body}
              </p>
            )}

            <span
              style={{
                marginTop: 'auto',
                alignSelf: 'flex-start',
                padding: '7px 14px',
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: accent,
                background: 'transparent',
                border: `1px solid ${accent}`,
              }}
            >
              {cta}
            </span>
          </article>
        )

        if (href) {
          return (
            <a
              key={ad.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
            >
              {card}
            </a>
          )
        }
        return <div key={ad.id}>{card}</div>
      })}
    </div>
  )
}
