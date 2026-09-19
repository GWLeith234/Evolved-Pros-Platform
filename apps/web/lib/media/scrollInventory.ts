/**
 * Phase 3a: denser 300x250 Partner/Sponsored scroll avails.
 * Longer Media pages get more mid-content rectangles. Empty-state
 * geometry still counts. No open ad network.
 */

export const MID_RECT_EVERY_LATEST = 4
export const MID_RECT_ARTICLE_FIRST = 4
export const MID_RECT_ARTICLE_EVERY = 5
export const MID_RECT_ARTICLE_MAX = 4
export const SECTION_LATEST_LIST = 16

export type HomeMidRectBand = 'after-featured' | 'after-sections' | 'after-podcast'

/** Module-band 300x250 units on /media home as content grows. */
export function homeMidRectBands(input: {
  featuredCount: number
  sectionCount: number
  episodeCount: number
}): HomeMidRectBand[] {
  const bands: HomeMidRectBand[] = []
  if (input.featuredCount > 0) bands.push('after-featured')
  if (input.sectionCount > 0) bands.push('after-sections')
  if (input.episodeCount > 0) bands.push('after-podcast')
  return bands
}

/**
 * Insert a 300x250 after every N Latest rows.
 * skipTrailing avoids stacking on a following mid-fluid.
 */
export function latestMidRectIndexes(
  latestCount: number,
  opts?: { every?: number; skipTrailing?: boolean },
): number[] {
  const every = Math.max(1, opts?.every ?? MID_RECT_EVERY_LATEST)
  const indexes: number[] = []
  if (latestCount < every) return indexes
  for (let i = every - 1; i < latestCount; i += every) {
    if (opts?.skipTrailing && i === latestCount - 1) continue
    indexes.push(i)
  }
  return indexes
}

export function sectionHasFeaturedRect(featuredCount: number): boolean {
  return featuredCount > 0
}

/**
 * Repeating mid-body 300x250 breaks. First unit after a few blocks,
 * then every MID_RECT_ARTICLE_EVERY. Never a lone unit at the top
 * and never after the last block (end article-inline stays separate).
 */
export function articleMidRectBreaks(blockCount: number): number[] {
  const first = Math.max(1, MID_RECT_ARTICLE_FIRST)
  if (blockCount < first + 1) return []
  const breaks: number[] = []
  for (
    let n = first;
    n < blockCount && breaks.length < MID_RECT_ARTICLE_MAX;
    n += MID_RECT_ARTICLE_EVERY
  ) {
    breaks.push(n)
  }
  return breaks
}

/** Distinct 300x250 units expected in the main scroll (not the 300x600 rail). */
export function countHomeScrollRects(input: {
  featuredCount: number
  latestCount: number
  sectionCount: number
  episodeCount: number
}): number {
  return (
    homeMidRectBands(input).length +
    latestMidRectIndexes(input.latestCount, { skipTrailing: true }).length
  )
}

export function countSectionScrollRects(input: {
  featuredCount: number
  latestCount: number
}): number {
  return (
    (sectionHasFeaturedRect(input.featuredCount) ? 1 : 0) +
    latestMidRectIndexes(input.latestCount, { skipTrailing: true }).length
  )
}

export function countArticleScrollRects(blockCount: number): number {
  // Mid-body repeats plus the existing end article-inline on a long piece.
  const mid = articleMidRectBreaks(blockCount).length
  return mid + (blockCount > 0 ? 1 : 0)
}
