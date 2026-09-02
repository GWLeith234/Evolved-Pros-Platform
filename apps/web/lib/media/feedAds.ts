import { adsConflictAdjacent, type MediaFeedAds } from '@/lib/sponsors/partners'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

export type MediaFeedChunk<T> =
  | { kind: 'stories'; items: T[] }
  | { kind: 'banner'; ad: SponsorAd }

export type MediaFeedLayout<T> = {
  /** After the hero when the card grid is too short to interleave a 728. */
  leadBanner: SponsorAd | null
  chunks: MediaFeedChunk<T>[]
  footer: SponsorAd[]
}

/**
 * Walk the magazine card grid in story-grid rows (3-up). Insert a Zone C
 * banner between rows only when another story row follows — never two ad
 * blocks back-to-back, never a 2×2 wall of squares.
 */
export function layoutMediaFeed<T>(
  stories: T[],
  feed: MediaFeedAds,
  rowSize = 3,
): MediaFeedLayout<T> {
  const rows: T[][] = []
  for (let i = 0; i < stories.length; i += rowSize) {
    rows.push(stories.slice(i, i + rowSize))
  }

  const banners = feed.banners.filter(a => a?.image_url)
  let bi = 0
  const leadBanner = rows.length < 2 ? banners[bi++] ?? null : null

  const chunks: MediaFeedChunk<T>[] = []
  for (let r = 0; r < rows.length; r++) {
    chunks.push({ kind: 'stories', items: rows[r] })
    if (r < rows.length - 1 && bi < banners.length) {
      chunks.push({ kind: 'banner', ad: banners[bi] })
      bi += 1
    }
  }

  // If a lead banner sits directly above the footer (no cards between),
  // drop footer units that would sit next to the same advertiser / house pair.
  const storiesBetweenLeadAndFooter = rows.length > 0
  const footer = leadBanner && !storiesBetweenLeadAndFooter
    ? feed.footer.filter(s => !adsConflictAdjacent(leadBanner, s))
    : feed.footer

  return { leadBanner, chunks, footer }
}
