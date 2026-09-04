import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import {
  MAGAZINE_ROW,
  MEDIA_DEEPER_EVERY,
  MEDIA_TIGHTEN_AFTER,
  interleaveAds,
  type RhythmChunk,
} from '@/lib/ads/rhythm'

export type MediaFeedChunk<T> = RhythmChunk<T, SponsorAd>

export type MediaFeedLayout<T> = {
  chunks: MediaFeedChunk<T>[]
}

/**
 * Village / SooToday: one centered unit after each 3-up story row.
 * After three rows the interval tightens to every two cards so the
 * deeper scroll stays punctuated. A single trailing unit is allowed.
 * Never adjacent ads, never a footer pair.
 */
export function layoutMediaFeed<T>(
  stories: T[],
  inFeed: SponsorAd[],
  every = MAGAZINE_ROW,
): MediaFeedLayout<T> {
  const ads = inFeed.filter(a => a?.image_url)
  return {
    chunks: interleaveAds(stories, ads, every, {
      trailing: true,
      tightenAfter: MEDIA_TIGHTEN_AFTER,
      deeperEvery: MEDIA_DEEPER_EVERY,
    }),
  }
}
