import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { interleaveAds, type RhythmChunk } from '@/lib/ads/rhythm'

export type MediaFeedChunk<T> = RhythmChunk<T, SponsorAd>

export type MediaFeedLayout<T> = {
  chunks: MediaFeedChunk<T>[]
}

/**
 * Magazine card grid in story-grid rows (3-up). One in-feed unit between
 * rows when another story row follows — never a footer pair, never two
 * ad blocks back-to-back, never a 2×2 wall of squares.
 */
export function layoutMediaFeed<T>(
  stories: T[],
  inFeed: SponsorAd[],
  rowSize = 3,
): MediaFeedLayout<T> {
  const ads = inFeed.filter(a => a?.image_url)
  return { chunks: interleaveAds(stories, ads, rowSize, { trailing: false }) }
}
