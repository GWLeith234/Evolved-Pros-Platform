import { AcademyLessonSponsors } from '@/components/academy/AcademyLessonSponsors'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { CLUSTER_IAB_MAX, isAcademyAd } from '@/lib/sponsors/partners'
import { isIabImageStill, isLeaderboardStill } from '@/lib/ads/iab'
import { LiveSectionHeader } from './LiveSectionHeader'

/**
 * One featured unit on LIVE. Callers place a second unit later in the
 * scroll — never a pair that reads as an ads board.
 */
export function LiveSponsors({ ads }: { ads: SponsorAd[] }) {
  const ad = ads.filter(a => !isLeaderboardStill(a)).slice(0, CLUSTER_IAB_MAX)[0]
  if (!ad) return null
  const still = isIabImageStill(ad)
  const house = isAcademyAd(ad)
  const title = still ? 'Sponsored' : house ? 'Evolved Pros Academy' : 'Evolution Partners'
  const kicker = still
    ? ''
    : house
      ? 'Six pillars. One system. Make excellence inevitable.'
      : 'Brands that back the operators on this stage.'

  return (
    <section className="live-section-pad" data-ad-rhythm="unit" style={{ margin: '56px auto 0' }}>
      <LiveSectionHeader
        eyebrow={still ? 'Advertisement' : house ? 'Academy' : 'Partners'}
        title={title}
        kicker={kicker}
      />
      <div style={{ marginTop: 8 }}>
        <AcademyLessonSponsors ads={[ad]} hideHeader />
      </div>
    </section>
  )
}
