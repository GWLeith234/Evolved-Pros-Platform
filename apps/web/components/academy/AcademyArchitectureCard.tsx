import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { stripTrailingArrow } from '@/lib/brand'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { HouseAdTracker } from '@/components/ads/HouseAdTracker'
import { inferHouseAdSlot } from '@/lib/ads/house'
import { ACADEMY_SPONSOR_AD } from '@/lib/sponsors/partners'

const PILLARS = [1, 2, 3, 4, 5, 6] as const

const DEFAULT_HEADLINE = 'Stop collecting tips. Build the system.'
const DEFAULT_SUB =
  'Six pillars. One architecture. The framework operators use to make excellence inevitable.'
const DEFAULT_CTA = 'Enter the Academy'

/**
 * Product promo for Evolved Pros Academy — not an Evolution Partner card.
 * Named pillars, conversion copy, internal CTA. No "Partner" badge.
 */
export function AcademyArchitectureCard({
  ad,
  href: _href,
  className,
  locationId = 'academy',
}: {
  ad?: SponsorAd | null
  /** Ignored — house Academy units always go to /pricing with UTMs. */
  href?: string
  className?: string
  locationId?: string
}) {
  void _href
  const headline = ad?.headline?.trim() || DEFAULT_HEADLINE
  const sub = ad?.endorsement_quote?.trim() || DEFAULT_SUB
  const cta = stripTrailingArrow(ad?.cta_text?.trim() || DEFAULT_CTA)
  const tracked = ad ?? ACADEMY_SPONSOR_AD
  const slot = inferHouseAdSlot(tracked)
  const wrapClass = ['group block h-full no-underline', className].filter(Boolean).join(' ')

  const inner = (
    <article
      className="ep-academy-arch-card relative flex h-full flex-col overflow-hidden rounded-2xl border transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform group-hover:scale-[1.01] group-hover:shadow-[0_14px_40px_rgba(201,168,76,0.18)]"
      style={{
        borderColor: 'rgba(201,168,76,0.35)',
        background:
          'radial-gradient(120% 90% at 12% 0%, var(--navy) 0%, var(--navy-dark) 45%, var(--navy-abyss) 100%)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style={{
          background:
            'linear-gradient(90deg, var(--brand-gold) 0%, var(--brand-gold-bright) 50%, var(--brand-gold) 100%)',
        }}
      />

      <div className="relative z-[1] flex flex-1 flex-col gap-5 p-5 pt-6 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p
            className="m-0 text-[11px] font-extrabold uppercase tracking-[0.22em]"
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              color: 'var(--brand-gold)',
            }}
          >
            The Evolved Architecture™
          </p>
          <span
            className="shrink-0 rounded px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em]"
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              background: 'rgba(201,168,76,0.15)',
              color: 'var(--brand-gold-bright)',
              border: '1px solid rgba(201,168,76,0.35)',
            }}
          >
            Academy
          </span>
        </div>

        <div>
          <h3
            className="m-0 text-[1.35rem] font-bold leading-[1.2] sm:text-[1.5rem]"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: 'var(--paper)',
              letterSpacing: '-0.01em',
            }}
          >
            {headline}
          </h3>
          <p
            className="mt-2 m-0 text-sm leading-relaxed"
            style={{
              fontFamily: '"Barlow", sans-serif',
              color: 'rgba(245,240,232,0.72)',
            }}
          >
            {sub}
          </p>
        </div>

        {/* Six named pillars — the product, not abstract bars */}
        <ul
          className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3"
          aria-label="Six pillars"
        >
          {PILLARS.map(n => {
            const p = PILLAR_CONFIG[n]
            return (
              <li
                key={n}
                className="flex items-center gap-2 rounded-md px-2.5 py-2"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: p.color, boxShadow: `0 0 10px ${p.color}66` }}
                />
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.08em]"
                  style={{
                    fontFamily: '"Barlow Condensed", sans-serif',
                    color: 'rgba(245,240,232,0.88)',
                  }}
                >
                  {p.label}
                </span>
              </li>
            )
          })}
        </ul>

        <div
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-extrabold uppercase tracking-[0.14em] text-white transition-[background-color,transform] duration-200"
          style={{
            backgroundColor: 'var(--brand-red)',
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
    </article>
  )

  return (
    <HouseAdTracker
      ad={tracked}
      slot={slot}
      locationId={locationId}
      className={wrapClass}
      ariaLabel={`${headline} — Evolved Pros Academy`}
    >
      {inner}
    </HouseAdTracker>
  )
}
