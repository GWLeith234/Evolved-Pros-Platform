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

/** Brand-red accent for Evolution Partner cards. */
export const SPONSOR_RED = '#C9302A'

/**
 * Red microphone disc — brand glyph fallback when a partner has no image.
 */
function MicGlyph() {
  return (
    <span
      className="flex h-20 w-20 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
      style={{
        backgroundColor: 'rgba(201,48,42,0.10)',
        border: '1px solid rgba(201,48,42,0.28)',
      }}
      aria-hidden
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        stroke={SPONSOR_RED}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="2" width="6" height="12" rx="3" fill={SPONSOR_RED} stroke="none" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <line x1="8" y1="21" x2="16" y2="21" />
      </svg>
    </span>
  )
}

/**
 * Centered premium Evolution Partner card.
 * - Dual-theme via CSS vars / ep-sponsor-card
 * - CSS-only hover (no React state) + evolution bars micro-animation
 * - Server-component safe (no hooks / event handlers)
 */
export function SponsorAdCard({ ad }: { ad: SponsorAd }) {
  const href = [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? null
  const name = ad.sponsor_name ?? ad.tool_name ?? 'Evolution Partner'
  const tagline = ad.headline ?? ad.endorsement_quote ?? name
  const cta = stripTrailingArrow(ad.cta_text ?? 'Learn More')

  const card = (
    <div className="ep-sponsor-card relative flex h-full flex-col rounded-2xl border p-6 pt-8 transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform group-hover:scale-[1.02] group-hover:shadow-[0_12px_36px_rgba(201,48,42,0.16)]">
      <span
        aria-hidden
        className="ep-sponsor-wash pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div
        className="absolute -top-3 right-6 z-[1] rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white shadow-sm"
        style={{
          backgroundColor: SPONSOR_RED,
          fontFamily: '"Barlow Condensed", sans-serif',
          boxShadow: '0 2px 8px rgba(201,48,42,0.35)',
        }}
      >
        Evolution Partner
      </div>

      {/* Rising evolution bars — CSS-only on group hover */}
      <div className="ep-evolve-bars" aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center space-y-5 text-center">
        {ad.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.image_url}
            alt={name}
            width={160}
            height={80}
            loading="lazy"
            decoding="async"
            className="h-20 w-auto max-w-[160px] object-contain opacity-90 transition-opacity duration-300 group-hover:opacity-100"
          />
        ) : (
          <MicGlyph />
        )}

        <div>
          <h4
            className="text-xl font-semibold tracking-wide"
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              color: 'var(--text-primary, #fff)',
              letterSpacing: '0.04em',
            }}
          >
            {name}
          </h4>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{
              fontFamily: '"Barlow", sans-serif',
              color: 'var(--text-secondary, rgba(255,255,255,0.55))',
            }}
          >
            {tagline}
          </p>
        </div>
      </div>

      <div
        className="relative z-[1] mt-6 pt-6"
        style={{ borderTop: '1px solid var(--border-color, rgba(255,255,255,0.10))' }}
      >
        <div
          className="ep-sponsor-cta inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold uppercase tracking-[0.14em] text-white transition-[background-color,transform] duration-200"
          style={{
            backgroundColor: SPONSOR_RED,
            fontFamily: '"Barlow Condensed", sans-serif',
          }}
        >
          {cta}
          <span
            aria-hidden
            className="inline-block transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
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
 * Sidebar sponsor — pure presentation. Pass `ad` from a server fetch on /home
 * (preferred) or from HomeSponsorAdClient when a client fallback is needed.
 */
export function HomeSponsorAd({ ad }: { ad: SponsorAd | null }) {
  if (!ad) return null

  return (
    <section aria-label="Sponsored">
      <SponsoredEyebrow />
      <SponsorAdCard ad={ad} />
    </section>
  )
}

/**
 * Two-up (or single) sponsor row. Pure presentation — data should be
 * server-fetched and passed in to avoid client waterfalls on /home.
 */
export function HomeSponsorRow({ ads }: { ads: SponsorAd[] }) {
  if (!ads.length) return null

  if (ads.length === 1) {
    return (
      <section aria-label="Sponsored">
        <SponsoredEyebrow />
        <div style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }}>
          <SponsorAdCard ad={ads[0]} />
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Sponsored">
      <SponsoredEyebrow />
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        style={{ width: '100%', maxWidth: 1440, margin: '0 auto', paddingTop: 4 }}
      >
        {ads.map(ad => (
          <SponsorAdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </section>
  )
}
