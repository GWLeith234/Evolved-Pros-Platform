import { stripTrailingArrow } from '@/lib/brand'
import {
  ADCELLERANT_ASSETS,
  EVOLVEX360_ASSETS,
  EVOLVEX360_LOCATIONS,
  VENDASTA_ASSETS,
  XPR_MEDIA_ASSETS,
  premiumPartnerKind,
  type PremiumPartnerKind,
} from '@/lib/sponsors/partners'
import { VendastaAvatarStack } from '@/components/sponsors/VendastaAvatarStack'

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
  /** Seconds each rotating slot holds this ad before advancing. Optional —
   *  flagship fallback partners omit it and inherit a sensible default. */
  rotation_interval?: number | null
}

export const SPONSOR_AD_COLUMNS =
  'id, image_url, click_url, link_url, headline, tool_name, sponsor_name, cta_text, endorsement_quote, rotation_interval'

/** Brand-red accent for Evolution Partner cards. */
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

type PremiumConfig = {
  brand: string
  fallbackHref: string
  fallbackHeadline: string
  fallbackSub: string
  fallbackCta: string
  logoSrc: string
  logoAlt: string
  /** Photo/SVG hero or null for CSS gradient hero (XPR). */
  heroImage: string | null
  heroGradient: string
  /** Optional locations / meta line under the tagline. */
  footerNote?: string
}

const PREMIUM: Record<Exclude<PremiumPartnerKind, null>, PremiumConfig> = {
  adcellerant: {
    brand: 'AdCellerant',
    fallbackHref: 'https://www.adcellerant.com/',
    fallbackHeadline: '#1 Largest Advertising Agency in Denver',
    fallbackSub: 'Recognized by the Denver Business Journal',
    fallbackCta: 'Partner with Us',
    logoSrc: ADCELLERANT_ASSETS.logoWhite,
    logoAlt: 'AdCellerant',
    heroImage: ADCELLERANT_ASSETS.skyline,
    heroGradient:
      'linear-gradient(180deg, rgba(10,15,24,0.15) 0%, rgba(10,15,24,0.55) 70%, rgba(10,15,24,0.92) 100%)',
  },
  vendasta: {
    brand: 'Vendasta',
    fallbackHref: 'https://www.vendasta.com/',
    fallbackHeadline: 'Meet the AI Workforce for local businesses',
    fallbackSub:
      'Boost more traffic, capture more leads, and grow revenue with AI employees that work 24/7.',
    fallbackCta: 'Get a demo',
    logoSrc: VENDASTA_ASSETS.logoWhite,
    logoAlt: 'Vendasta',
    heroImage: VENDASTA_ASSETS.hero,
    heroGradient:
      'linear-gradient(180deg, rgba(10,47,56,0.2) 0%, rgba(10,37,48,0.55) 65%, rgba(10,37,48,0.92) 100%)',
  },
  evolvex360: {
    brand: 'EvolveX360',
    fallbackHref: 'https://www.evolvex360.com/',
    fallbackHeadline: 'Unlock the Future with AI Solutions from EvolveX360',
    fallbackSub:
      'AI-powered business efficiency and growth — strategy, media, and execution that open new markets worldwide.',
    fallbackCta: 'Unlock AI Growth',
    logoSrc: EVOLVEX360_ASSETS.logoWhite,
    logoAlt: 'EvolveX360',
    heroImage: EVOLVEX360_ASSETS.hero,
    heroGradient:
      'linear-gradient(180deg, rgba(14,12,42,0.15) 0%, rgba(14,12,42,0.55) 65%, rgba(10,15,24,0.92) 100%)',
    footerNote: EVOLVEX360_LOCATIONS,
  },
  xpr: {
    brand: 'XPR Media',
    fallbackHref: 'https://www.xpr.media/',
    fallbackHeadline: 'Amplify Your Story Across 1,000+ Premium Sites',
    fallbackSub:
      'Content syndication that puts PR, publishers, and brands in front of the right audience — at scale.',
    fallbackCta: 'Expand Your Reach',
    logoSrc: XPR_MEDIA_ASSETS.logo,
    logoAlt: 'XPR Media',
    heroImage: null,
    heroGradient:
      'linear-gradient(135deg, #0A0F18 0%, #1A2332 42%, #2A1A1A 72%, #C9302A 140%)',
  },
}

/**
 * Shared premium Evolution Partner shell — skyline or gradient hero,
 * brand logo, strong headline, tagline, red CTA. Theme-aware body.
 * Pure presentation (no hooks / event handlers).
 */
function PremiumPartnerCard({
  ad,
  kind,
}: {
  ad: SponsorAd
  kind: Exclude<PremiumPartnerKind, null>
}) {
  const cfg = PREMIUM[kind]
  const href = [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? cfg.fallbackHref
  const headline = ad.headline ?? cfg.fallbackHeadline
  const subtext = ad.endorsement_quote ?? cfg.fallbackSub
  const cta = stripTrailingArrow(ad.cta_text ?? cfg.fallbackCta)

  const card = (
    <div className="ep-sponsor-card ep-premium-partner-card relative flex h-full flex-col overflow-hidden rounded-2xl border transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform group-hover:scale-[1.015] group-hover:shadow-[0_14px_40px_rgba(201,48,42,0.18)]">
      <span
        aria-hidden
        className="ep-sponsor-wash pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div
        className="absolute right-5 top-3 z-[2] rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0A0F18] shadow-sm"
        style={{
          backgroundColor: 'var(--brand-gold, #C9A84C)',
          fontFamily: '"Barlow Condensed", sans-serif',
          boxShadow: '0 2px 8px rgba(201,168,76,0.35)',
        }}
      >
        Partner
      </div>

      {/* Hero — Vendasta uses 4 Supabase avatars (AI workforce faces) */}
      <div className="relative h-[132px] w-full shrink-0 overflow-hidden">
        {kind === 'vendasta' ? (
          <div
            className="relative flex h-full w-full items-end justify-between px-5 pb-10 pt-6"
            style={{
              background:
                'linear-gradient(135deg, #0A2F38 0%, #0D3D48 40%, #124A52 70%, #0A2530 100%)',
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 70% 40%, rgba(0,200,150,0.25), transparent 60%)',
              }}
            />
            <VendastaAvatarStack size={52} className="relative z-[1]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cfg.logoSrc}
              alt={cfg.logoAlt}
              width={160}
              height={28}
              loading="lazy"
              decoding="async"
              className="relative z-[1] h-6 w-auto max-w-[45%] object-contain object-right drop-shadow-md"
            />
          </div>
        ) : cfg.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cfg.heroImage}
            alt=""
            aria-hidden
            width={792}
            height={198}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div
            aria-hidden
            className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            style={{ background: cfg.heroGradient }}
          >
            {/* Subtle network grid for XPR */}
            <svg
              className="absolute inset-0 h-full w-full opacity-25"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern id="xpr-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <path d="M28 0H0V28" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#xpr-grid)" />
              <circle cx="18%" cy="40%" r="3" fill="#C9302A" opacity="0.7" />
              <circle cx="42%" cy="28%" r="2" fill="#fff" opacity="0.35" />
              <circle cx="68%" cy="55%" r="2.5" fill="#C9302A" opacity="0.55" />
              <circle cx="82%" cy="32%" r="2" fill="#fff" opacity="0.3" />
              <line x1="18%" y1="40%" x2="42%" y2="28%" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
              <line x1="42%" y1="28%" x2="68%" y2="55%" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <line x1="68%" y1="55%" x2="82%" y2="32%" stroke="rgba(201,48,42,0.45)" strokeWidth="1" />
            </svg>
          </div>
        )}
        {cfg.heroImage && kind !== 'vendasta' && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: cfg.heroGradient }}
          />
        )}
        {kind !== 'vendasta' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cfg.logoSrc}
            alt={cfg.logoAlt}
            width={200}
            height={30}
            loading="lazy"
            decoding="async"
            className="absolute bottom-4 left-5 h-6 sm:h-7 w-auto max-w-[min(200px,70%)] object-contain object-left drop-shadow-md"
          />
        )}
        <span
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-[3px]"
          style={{ backgroundColor: SPONSOR_RED }}
        />
      </div>

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
            {cfg.brand}
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
          {cfg.footerNote && (
            <p
              className="mt-3 m-0 text-[10px] font-semibold uppercase leading-snug tracking-[0.06em]"
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                color: 'var(--text-tertiary, rgba(255,255,255,0.4))',
              }}
            >
              {cfg.footerNote}
            </p>
          )}
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
      aria-label={`${headline} — ${cfg.brand} Evolution Partner`}
    >
      {card}
    </a>
  )
}

/**
 * Evolution Partner card router.
 * Flagship partners (AdCellerant, XPR Media) get the premium hero layout;
 * other ads use the centered logo + tagline card.
 */
export function SponsorAdCard({ ad }: { ad: SponsorAd }) {
  const kind = premiumPartnerKind(ad)
  if (kind) return <PremiumPartnerCard ad={ad} kind={kind} />

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
        className="absolute -top-3 right-6 z-[1] rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0A0F18] shadow-sm"
        style={{
          backgroundColor: 'var(--brand-gold, #C9A84C)',
          fontFamily: '"Barlow Condensed", sans-serif',
          boxShadow: '0 2px 8px rgba(201,168,76,0.35)',
        }}
      >
        Partner
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

export function HomeSponsorAd({ ad }: { ad: SponsorAd | null }) {
  if (!ad) return null

  return (
    <section aria-label="Sponsored">
      <SponsoredEyebrow />
      <SponsorAdCard ad={ad} />
    </section>
  )
}

export function HomeSponsorRow({ ads }: { ads: SponsorAd[] }) {
  // Never render the same partner twice in one row
  const seen = new Set<string>()
  const unique = ads.filter(ad => {
    if (!ad?.id || seen.has(ad.id)) return false
    seen.add(ad.id)
    return true
  })
  if (!unique.length) return null

  if (unique.length === 1) {
    return (
      <section aria-label="Sponsored">
        <SponsoredEyebrow />
        <div style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }}>
          <SponsorAdCard ad={unique[0]} />
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
        {unique.map(ad => (
          <SponsorAdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </section>
  )
}
