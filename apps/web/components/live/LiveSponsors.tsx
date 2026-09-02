import { AcademyLessonSponsors } from '@/components/academy/AcademyLessonSponsors'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { FOOTER_IAB_MAX, isAcademyAd } from '@/lib/sponsors/partners'
import { isIabImageStill, isLeaderboardStill } from '@/lib/ads/iab'
import { LiveSectionHeader } from './LiveSectionHeader'

/**
 * 1–2 featured cards on the LIVE page (Academy promo + Evolution Partner).
 * Section header lives here once — AcademyLessonSponsors is body-only.
 */
export function LiveSponsors({ ads }: { ads: SponsorAd[] }) {
  const slice = ads.filter(a => !isLeaderboardStill(a)).slice(0, FOOTER_IAB_MAX)
  if (!slice.length) return null
  const stillsOnly = slice.every(isIabImageStill)
  const hasAcademy = slice.some(isAcademyAd)
  const hasPartner = slice.some(a => !isAcademyAd(a))
  const title = stillsOnly
    ? 'Sponsored'
    : hasAcademy && hasPartner
      ? 'Featured'
      : hasAcademy
        ? 'Evolved Pros Academy'
        : 'Evolution Partners'
  const kicker = stillsOnly
    ? ''
    : hasAcademy && hasPartner
      ? 'Build the architecture — and the partners behind the operators on this stage.'
      : hasAcademy
        ? 'Six pillars. One system. Make excellence inevitable.'
        : 'Brands that back the operators on this stage.'

  return (
    <section className="live-section-pad" style={{ margin: '56px auto 0' }}>
      <LiveSectionHeader
        eyebrow={stillsOnly ? 'Sponsored' : hasAcademy ? 'Academy' : 'Partners'}
        title={title}
        kicker={kicker}
      />
      <div style={{ marginTop: 8 }}>
        <AcademyLessonSponsors ads={slice} hideHeader />
      </div>
    </section>
  )
}
