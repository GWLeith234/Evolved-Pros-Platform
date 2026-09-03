import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { MAGAZINE_ROW, interleaveAds, type RhythmChunk } from '@/lib/ads/rhythm'

export type MediaFeedChunk<T> = RhythmChunk<T, SponsorAd>

export type MediaFeedLayout<T> = {
  chunks: MediaFeedChunk<T>[]
}

/**
 * Village / SooToday: one centered unit after each 3-up story row.
 * A single trailing unit is allowed. Never adjacent ads, never a footer pair.
 */
export function layoutMediaFeed<T>(
  stories: T[],
  inFeed: SponsorAd[],
  every = MAGAZINE_ROW,
): MediaFeedLayout<T> {
  const ads = inFeed.filter(a => a?.image_url)
  return { chunks: interleaveAds(stories, ads, every, { trailing: true }) }
}
