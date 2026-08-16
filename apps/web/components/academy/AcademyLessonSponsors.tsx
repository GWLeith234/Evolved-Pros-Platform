import { SponsorAdCard, type SponsorAd } from '@/components/home/HomeSponsorAd'

/**
 * Evolution Partner strip for Academy lesson / course pages.
 * 1–2 premium cards — after main content, before discussion / related lessons.
 * Pass hideHeader when a parent already renders the section title (e.g. LIVE).
 */
export function AcademyLessonSponsors({
  ads,
  hideHeader = false,
}: {
  ads: SponsorAd[]
  hideHeader?: boolean
}) {
  if (!ads.length) return null
  // Dedupe by id so the same partner never appears twice in one strip
  const seen = new Set<string>()
  const shown: SponsorAd[] = []
  for (const ad of ads) {
    if (!ad?.id || seen.has(ad.id)) continue
    seen.add(ad.id)
    shown.push(ad)
    if (shown.length >= 2) break
  }
  if (!shown.length) return null

  return (
    <section
      aria-label="Evolution Partners"
      style={{
        marginTop: hideHeader ? 0 : 8,
        marginBottom: hideHeader ? 0 : 40,
        paddingTop: hideHeader ? 0 : 28,
        borderTop: hideHeader ? 'none' : '1px solid var(--border-color, rgba(255,255,255,0.08))',
      }}
    >
      {!hideHeader && (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-condensed), sans-serif',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--brand-red, #C9302A)',
            }}
          >
            Evolution Partners
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-condensed), sans-serif',
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary, rgba(255,255,255,0.35))',
            }}
          >
            Hand-picked tools
          </p>
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: shown.length > 1 ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr',
          gap: 16,
          maxWidth: 960,
        }}
      >
        {shown.map(ad => (
          <SponsorAdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </section>
  )
}
