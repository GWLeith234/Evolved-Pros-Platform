import { SponsorAdCard, type SponsorAd } from '@/components/home/HomeSponsorAd'
import { IabAdvertisementSlot } from '@/components/ads/IabImageAd'
import { CLUSTER_IAB_MAX, isAcademyAd } from '@/lib/sponsors/partners'
import { isIabImageStill, isLeaderboardStill } from '@/lib/ads/iab'

/**
 * One IAB / house unit. Callers space these through the scroll —
 * this component never renders a pair or a grid of ads.
 */
export function AcademyLessonSponsors({
  ads,
  hideHeader = false,
}: {
  ads: SponsorAd[]
  hideHeader?: boolean
}) {
  if (!ads.length) return null
  const seen = new Set<string>()
  const shown: SponsorAd[] = []
  for (const ad of ads) {
    if (!ad?.id || seen.has(ad.id)) continue
    if (isLeaderboardStill(ad)) continue
    seen.add(ad.id)
    shown.push(ad)
    if (shown.length >= CLUSTER_IAB_MAX) break
  }
  if (!shown.length) return null

  const ad = shown[0]
  const still = isIabImageStill(ad)
  const house = isAcademyAd(ad)
  const aria = still ? 'Advertisement' : house ? 'Evolved Pros Academy' : 'Advertisement'

  return (
    <section
      aria-label={aria}
      data-ad-rhythm="unit"
      className={hideHeader ? undefined : 'ep-ad-slot'}
      style={{
        marginTop: hideHeader ? 0 : undefined,
        marginBottom: hideHeader ? 0 : undefined,
        paddingTop: hideHeader ? 0 : undefined,
        borderTop: hideHeader ? 'none' : '1px solid var(--border-color, rgba(255,255,255,0.08))',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {still && ad.image_url ? (
        <IabAdvertisementSlot
          ad={{ ...ad, image_url: ad.image_url }}
          locationId="academy"
        />
      ) : (
        <SponsorAdCard ad={ad} locationId="academy" />
      )}
    </section>
  )
}
