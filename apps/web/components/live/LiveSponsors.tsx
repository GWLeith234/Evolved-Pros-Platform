import { AcademyLessonSponsors } from '@/components/academy/AcademyLessonSponsors'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { LiveSectionHeader } from './LiveSectionHeader'

/**
 * 1–2 Evolution Partner cards on the LIVE page.
 * Section header lives here once — AcademyLessonSponsors is body-only.
 */
export function LiveSponsors({ ads }: { ads: SponsorAd[] }) {
  if (!ads.length) return null
  return (
    <section className="live-section-pad" style={{ margin: '56px auto 0' }}>
      <LiveSectionHeader
        eyebrow="Partners"
        title="Evolution Partners"
        kicker="Brands that back the operators on this stage."
      />
      <div style={{ marginTop: 8 }}>
        <AcademyLessonSponsors ads={ads.slice(0, 2)} hideHeader />
      </div>
    </section>
  )
}
