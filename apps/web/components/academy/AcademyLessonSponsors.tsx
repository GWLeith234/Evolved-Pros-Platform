import { SponsorAdCard, SponsoredEyebrow, type SponsorAd } from '@/components/home/HomeSponsorAd'

/**
 * Evolution Partner strip for Academy lesson pages.
 * Renders 1–2 premium cards after lesson content, before discussion.
 */
export function AcademyLessonSponsors({ ads }: { ads: SponsorAd[] }) {
  if (!ads.length) return null
  const shown = ads.slice(0, 2)

  return (
    <section
      aria-label="Evolution Partners"
      style={{ marginBottom: 40 }}
    >
      <SponsoredEyebrow />
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
