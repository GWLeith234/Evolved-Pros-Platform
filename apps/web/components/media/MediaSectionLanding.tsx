import { MediaPartnerSlot, MediaScrollRect } from '@/components/media/MediaPartnerSlot'
import {
  NewspaperBriefCta,
  NewspaperDualHero,
  NewspaperFeaturedGrid,
  NewspaperLatestRail,
  NewspaperMostRead,
  NewspaperOnAir,
  type NewspaperStory,
} from '@/components/media/newspaper'
import { splitSectionDesk } from '@/lib/media/desk'
import {
  SECTION_LATEST_LIST,
  latestMidRectIndexes,
  sectionHasFeaturedRect,
} from '@/lib/media/scrollInventory'
import { getActivePlatformAds } from '@/lib/cache/shared'
import { pickMediaFeedAds } from '@/lib/sponsors/partners'
import { adMatchesSurface } from '@/lib/ads/iab'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { MEDIA_BRAND } from '@/lib/media/brand'

export async function MediaSectionLanding({
  sectionId,
  title,
  articles,
}: {
  sectionId: string
  title: string
  articles: NewspaperStory[]
}) {
  let mediaAds: ReturnType<typeof pickMediaFeedAds> = { sidebar: null, inFeed: [] }
  try {
    const catalog = ((await getActivePlatformAds()) as SponsorAd[]).filter(a =>
      adMatchesSurface(a, 'media'),
    )
    mediaAds = pickMediaFeedAds(catalog)
  } catch {
    // Ads must not blank the section when the catalog is unreachable.
  }

  const desk = splitSectionDesk(articles, { latestList: SECTION_LATEST_LIST })
  const leaderboardAd = mediaAds.inFeed[0] ?? null
  const midFluidAd = mediaAds.inFeed[1] ?? null
  const showFeaturedRect = sectionHasFeaturedRect(desk.featuredGrid.length)
  const latestRectAt = latestMidRectIndexes(desk.latestList.length, { skipTrailing: true })
  let nextRect = 2
  const takeRect = () => mediaAds.inFeed[nextRect++] ?? null
  const featuredRectAd = showFeaturedRect ? takeRect() : null
  const latestRectAds = latestRectAt.map(() => takeRect())

  return (
    <div className="ep-media-home" data-media-surface="section" data-media-section={sectionId}>
      <div className="ep-media-home-inner">
        <header className="ep-media-section-hero">
          <p className="ep-media-section-eyebrow">{MEDIA_BRAND}</p>
          <h1 className="ep-media-section-title">{title}</h1>
        </header>

        <div className="ep-media-leaderboard">
          <MediaPartnerSlot kind="leaderboard" ad={leaderboardAd} locationId="media-section-leaderboard" />
        </div>

        <div className="ep-media-home-grid">
          <div className="ep-media-home-main">
            <NewspaperDualHero lede={desk.featured} secondary={desk.secondary} mini />
            <NewspaperFeaturedGrid stories={desk.featuredGrid} />
            {showFeaturedRect ? (
              <MediaScrollRect ad={featuredRectAd} locationId="media-section-rect-featured" />
            ) : null}
            <NewspaperLatestRail
              stories={desk.latestList}
              title="Latest"
              insertSponsoredAt={1}
              midRectAt={latestRectAt}
              midRectAds={latestRectAds}
            />
            <div className="ep-media-mid-fluid">
              <MediaPartnerSlot kind="mid-fluid" ad={midFluidAd} locationId="media-section-mid-fluid" />
            </div>
          </div>

          <aside className="ep-media-home-rail">
            <NewspaperOnAir />
            <NewspaperMostRead stories={articles} />
            <NewspaperBriefCta />
            <div className="ep-media-rail-slot media-sticky-rail">
              <MediaPartnerSlot kind="rail-half" ad={mediaAds.sidebar} locationId="media-section-rail" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
