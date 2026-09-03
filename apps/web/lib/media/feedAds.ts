import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { FEED_AD_EVERY, interleaveAds, type RhythmChunk } from '@/lib/ads/rhythm'

export type MediaFeedChunk<T> = RhythmChunk<T, SponsorAd>

export type MediaFeedLayout<T> = {
  chunks: MediaFeedChunk<T>[]
}

/**
 * Magazine cards dominate. One in-feed unit after each 3-up row,
 * never after the last row, never a footer pair.
 */
export function layoutMediaFeed<T>(
  stories: T[],
  inFeed: SponsorAd[],
  every = FEED_AD_EVERY,
): MediaFeedLayout<T> {
  const ads = inFeed.filter(a => a?.image_url)
  return { chunks: interleaveAds(stories, ads, every, { trailing: false }) }
}
