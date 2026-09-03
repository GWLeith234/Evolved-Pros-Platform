import { stripTrailingArrow } from '@/lib/brand'
import { isAcademyAd } from '@/lib/sponsors/partners'
import { AcademyArchitectureCard } from '@/components/academy/AcademyArchitectureCard'
import { IabAdvertisementSlot } from '@/components/ads/IabImageAd'
import { isIabImageStill } from '@/lib/ads/iab'

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
  rotation_interval?: number | null
  ad_type?: string | null
  title?: string | null
  body_copy?: string | null
  zone?: string | null
  placement?: string | null
  placements?: string[] | null
  start_date?: string | null
  end_date?: string | null
  is_active?: boolean | null
}

export const SPONSOR_AD_COLUMNS =
  'id, image_url, click_url, link_url, headline, tool_name, sponsor_name, cta_text, endorsement_quote, rotation_interval, ad_type, title, body_copy, zone, placement, placements, start_date, end_date, is_active'

export const SPONSOR_RED = '#C9302A'

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
 * IAB Image stills → the uploaded PNG only (no Partner chrome).
 * Academy copy units → architecture card.
 * Text/logo partners with real copy → logo + tagline (never invented fallbacks).
 */
export function SponsorAdCard({ ad, locationId = 'home' }: { ad: SponsorAd; locationId?: string }) {
  if (isIabImageStill(ad) && ad.image_url) {
    return (
      <IabAdvertisementSlot
        ad={{ ...ad, image_url: ad.image_url }}
        locationId={locationId}
        className="pt-3"
      />
    )
  }

  if (ad.image_url && !ad.headline?.trim() && !ad.cta_text?.trim() && !ad.body_copy?.trim()) {
    return (
      <IabAdvertisementSlot
        ad={{ ...ad, image_url: ad.image_url }}
        locationId={locationId}
        className="pt-3"
      />
    )
  }

  if (isAcademyAd(ad)) return <AcademyArchitectureCard ad={ad} className="pt-3" locationId={locationId} />

  const href = [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? null
  const name = ad.sponsor_name ?? ad.tool_name ?? 'Advertisement'
  const tagline = ad.headline ?? ad.endorsement_quote ?? ''
  const cta = ad.cta_text ? stripTrailingArrow(ad.cta_text) : ''

  const card = (
    <div className="ep-sponsor-card relative flex h-full flex-col rounded-2xl border p-6 pt-8 transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform group-hover:scale-[1.02] group-hover:shadow-[0_12px_36px_rgba(201,48,42,0.16)]">
      <span
        aria-hidden
        className="ep-sponsor-wash pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center space-y-5 text-center">
        {ad.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.image_url}
            alt={name}
            width={200}
            height={96}
            loading="lazy"
            decoding="async"
            className="h-24 w-auto max-w-[200px] object-contain opacity-95 transition-opacity duration-300 group-hover:opacity-100"
          />
        ) : (
          <MicGlyph />
        )}

        <div>
          {ad.headline ? (
            <h4
              className="text-xl font-semibold tracking-wide"
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                color: 'var(--text-primary, #fff)',
                letterSpacing: '0.04em',
              }}
            >
              {ad.headline}
            </h4>
          ) : null}
          {tagline && tagline !== ad.headline ? (
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{
                fontFamily: '"Barlow", sans-serif',
                color: 'var(--text-secondary, rgba(255,255,255,0.55))',
              }}
            >
              {tagline}
            </p>
          ) : null}
        </div>
      </div>

      {cta && href ? (
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
      ) : null}
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
          color: 'var(--text-secondary, rgba(255,255,255,0.65))',
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
    </div>
  )
}

export function HomeSponsorAd({ ad }: { ad: SponsorAd | null }) {
  if (!ad) return null

  if (isIabImageStill(ad)) {
    return (
      <section aria-label="Advertisement">
        <SponsorAdCard ad={ad} locationId="home" />
      </section>
    )
  }

  if (isAcademyAd(ad)) {
    return (
      <section aria-label="Evolved Pros Academy">
        <SponsorAdCard ad={ad} locationId="home" />
      </section>
    )
  }

  return (
    <section aria-label="Sponsored">
      <SponsoredEyebrow />
      <SponsorAdCard ad={ad} locationId="home" />
    </section>
  )
}

export function HomeSponsorRow({ ads }: { ads: SponsorAd[] }) {
  // Safety lock: a pair/grid of units reads as an ads board.
  // Home places remaining inventory between sections, one at a time.
  const ad = ads.find(a => a?.id)
  if (!ad) return null
  return <HomeSponsorAd ad={ad} />
}
