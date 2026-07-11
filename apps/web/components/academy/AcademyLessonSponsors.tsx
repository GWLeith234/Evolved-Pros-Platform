import { SponsorAdCard, type SponsorAd } from '@/components/home/HomeSponsorAd'

/**
 * Evolution Partner strip for Academy lesson / course pages.
 * 1–2 premium cards — after main content, before discussion / related lessons.
 * Non-intrusive (compact section) but prominent (red badge + full card treatment).
 */
export function AcademyLessonSponsors({ ads }: { ads: SponsorAd[] }) {
  if (!ads.length) return null
  const shown = ads.slice(0, 2)

  return (
    <section
      aria-label="Evolution Partners"
      style={{
        marginTop: 8,
        marginBottom: 40,
        paddingTop: 28,
        borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))',
      }}
    >
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
            fontFamily: '"Barlow Condensed", sans-serif',
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
            fontFamily: '"Barlow Condensed", sans-serif',
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
