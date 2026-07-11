import { stripTrailingArrow } from '@/lib/brand'
import {
  ADCELLERANT_ASSETS,
  isAdCellerantAd,
} from '@/lib/sponsors/adcellerant'

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
 * Premium AdCellerant Evolution Partner card — Denver skyline hero,
 * white logo, #1 DBJ claim, theme-aware body, red accents.
 * Pure presentation (no hooks / event handlers).
 */
function AdCellerantPremiumCard({ ad }: { ad: SponsorAd }) {
  const href = [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? 'https://www.adcellerant.com/'
  const headline = ad.headline ?? '#1 Largest Advertising Agency in Denver'
  const subtext = ad.endorsement_quote ?? 'Recognized by the Denver Business Journal'
  const cta = stripTrailingArrow(ad.cta_text ?? 'Partner with Us')

  const card = (
    <div className="ep-sponsor-card ep-adcellerant-card relative flex h-full flex-col overflow-hidden rounded-2xl border transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform group-hover:scale-[1.015] group-hover:shadow-[0_14px_40px_rgba(201,48,42,0.18)]">
      <span
        aria-hidden
        className="ep-sponsor-wash pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* Badge */}
      <div
        className="absolute right-5 top-3 z-[2] rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white shadow-sm"
        style={{
          backgroundColor: SPONSOR_RED,
          fontFamily: '"Barlow Condensed", sans-serif',
          boxShadow: '0 2px 8px rgba(201,48,42,0.35)',
        }}
      >
        Evolution Partner
      </div>

      {/* Skyline hero */}
      <div className="relative h-[132px] w-full shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ADCELLERANT_ASSETS.skyline}
          alt=""
          aria-hidden
          width={792}
          height={198}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,15,24,0.15) 0%, rgba(10,15,24,0.55) 70%, rgba(10,15,24,0.92) 100%)',
          }}
        />
        {/* White logo over skyline */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ADCELLERANT_ASSETS.logoWhite}
          alt="AdCellerant"
          width={160}
          height={30}
          loading="lazy"
          decoding="async"
          className="absolute bottom-4 left-5 h-7 w-auto max-w-[160px] object-contain drop-shadow-md"
        />
        {/* Red accent bar at hero base */}
        <span
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-[3px]"
          style={{ backgroundColor: SPONSOR_RED }}
        />
      </div>

      {/* Copy + CTA — theme-aware surface */}
      <div className="relative z-[1] flex flex-1 flex-col gap-4 p-5 pt-4">
        <div className="ep-evolve-bars" aria-hidden style={{ left: 20, bottom: 72 }}>
          <span />
          <span />
          <span />
        </div>

        <div>
          <p
            className="m-0 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              color: SPONSOR_RED,
            }}
          >
            AdCellerant
          </p>
          <h4
            className="mt-1.5 m-0 text-[1.15rem] font-bold leading-[1.25]"
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              color: 'var(--text-primary, #fff)',
              letterSpacing: '0.01em',
            }}
          >
            {headline}
          </h4>
          <p
            className="mt-2 m-0 text-sm leading-relaxed"
            style={{
              fontFamily: '"Barlow", sans-serif',
              color: 'var(--text-secondary, rgba(255,255,255,0.55))',
            }}
          >
            {subtext}
          </p>
        </div>

        <div
          className="ep-sponsor-cta mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold uppercase tracking-[0.14em] text-white transition-[background-color,transform] duration-200"
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

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group block h-full pt-3 no-underline"
      aria-label={`${headline} — AdCellerant Evolution Partner`}
    >
      {card}
    </a>
  )
}

/**
 * Centered premium Evolution Partner card.
 * - Dual-theme via CSS vars / ep-sponsor-card
 * - CSS-only hover (no React state) + evolution bars micro-animation
 * - Server-component safe (no hooks)
 * - AdCellerant ads render the skyline premium layout automatically
 */
export function SponsorAdCard({ ad }: { ad: SponsorAd }) {
  if (isAdCellerantAd(ad)) {
    return <AdCellerantPremiumCard ad={ad} />
  }

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
