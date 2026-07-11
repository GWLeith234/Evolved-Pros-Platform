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
    <section style={{ maxWidth: 1280, margin: '56px auto 0', padding: '0 24px' }}>
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
