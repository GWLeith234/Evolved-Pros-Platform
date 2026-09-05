/**
 * One ad grammar for the platform — Village / SooToday punctuation.
 *
 * Story (or curriculum, or feed) is the page. Ads are single units that
 * appear between real content. Never two or more units with only an
 * Advertisement label between them. Leftover inventory is not dumped
 * as a footer pair or a 2×2 board.
 *
 * Density grows with scroll depth: the first screen uses the surface
 * interval; later groups tighten so a long page does not go thin.
 */

/** Magazine is 3-up; one centered unit after each row. */
export const MAGAZINE_ROW = 3
export const FEED_AD_EVERY = MAGAZINE_ROW
/** Home editorial rows: two content cards, then an IAB — never a third card. */
export const HOME_CONTENT_CARDS = 2
/** Academy section threads: one unit after every three lesson cards. */
export const ACADEMY_CARDS_PER_AD = 3
/** Podcast archive: 4 cards, then a box; tighter after the first two rows. */
export const PODCAST_AD_EVERY = 4
/** Community feed: one unit after a short run of posts. */
export const COMMUNITY_AD_EVERY = 3

/** After this many items, magazine / community / academy lists tighten. */
export const MEDIA_TIGHTEN_AFTER = MAGAZINE_ROW * 3
export const MEDIA_DEEPER_EVERY = 2
export const COMMUNITY_TIGHTEN_AFTER = COMMUNITY_AD_EVERY * 3
export const COMMUNITY_DEEPER_EVERY = 2
export const PODCAST_TIGHTEN_AFTER = PODCAST_AD_EVERY * 2
export const PODCAST_DEEPER_EVERY = 3
export const ACADEMY_TIGHTEN_AFTER = ACADEMY_CARDS_PER_AD * 4
export const ACADEMY_DEEPER_EVERY = 2

export type RhythmChunk<T, A> =
  | { kind: 'content'; items: T[] }
  | { kind: 'ad'; ad: A }

export type ArticleChunk<A> =
  | { kind: 'html'; html: string }
  | { kind: 'ad'; ad: A }

export type InterleaveOptions = {
  trailing?: boolean
  /** After this many items have been placed, switch to `deeperEvery`. */
  tightenAfter?: number
  deeperEvery?: number
}

/**
 * Group sizes that stay at `every` until `tightenAfter` items, then
 * switch to `deeperEvery` so a long list gets denser, not thinner.
 */
export function cadenceGroupSizes(
  itemCount: number,
  every: number,
  options?: { tightenAfter?: number; deeperEvery?: number },
): number[] {
  if (itemCount <= 0) return []
  const start = Math.max(1, every)
  const deeper = Math.max(1, options?.deeperEvery ?? Math.max(1, start - 1))
  const tightenAfter = options?.tightenAfter
  const sizes: number[] = []
  let placed = 0
  while (placed < itemCount) {
    const useDeeper = tightenAfter != null && placed >= tightenAfter
    const size = Math.min(useDeeper ? deeper : start, itemCount - placed)
    sizes.push(size)
    placed += size
  }
  return sizes
}

/**
 * Walk items in cadence groups. Insert one ad after a group only when
 * another content group follows — unless `trailing` is on, in which case
 * a single unit may follow the last content group. Never adjacent ads.
 */
export function interleaveAds<T, A>(
  items: T[],
  ads: A[],
  every = FEED_AD_EVERY,
  options?: InterleaveOptions,
): RhythmChunk<T, A>[] {
  const trailing = options?.trailing ?? false
  const sizes = cadenceGroupSizes(items.length, every, {
    tightenAfter: options?.tightenAfter,
    deeperEvery: options?.deeperEvery,
  })
  const chunks: RhythmChunk<T, A>[] = []
  let offset = 0
  let ai = 0

  for (let g = 0; g < sizes.length; g++) {
    const size = sizes[g] as number
    const group = items.slice(offset, offset + size)
    offset += size
    chunks.push({ kind: 'content', items: group })
    const hasMoreContent = g < sizes.length - 1
    if (ai < ads.length && (hasMoreContent || trailing)) {
      chunks.push({ kind: 'ad', ad: ads[ai] as A })
      ai += 1
    }
  }

  return chunks
}

export function hasAdjacentAds<T, A>(chunks: ReadonlyArray<RhythmChunk<T, A> | ArticleChunk<A>>): boolean {
  for (let i = 1; i < chunks.length; i++) {
    if (chunks[i - 1]?.kind === 'ad' && chunks[i]?.kind === 'ad') return true
  }
  return false
}

/** Split article HTML on block close so we can punctuate with IAB units. */
export function splitHtmlBlocks(html: string): string[] {
  if (!html.trim()) return []
  const byClose = html
    .split(/(?<=<\/(?:p|h1|h2|h3|h4|blockquote|ul|ol|figure|pre)>)/i)
    .map(part => part.trim())
    .filter(Boolean)
  if (byClose.length >= 3) return byClose
  const byOpen = html
    .split(/(?=<p[\s>])/i)
    .map(part => part.trim())
    .filter(Boolean)
  return byOpen.length > byClose.length ? byOpen : byClose
}

/**
 * Prefer a single late slot so mid-article does not fill with empty
 * Advertisement chrome. Short copy stays clean. Real Village/house
 * units still render when inventory exists (related / end slot).
 */
export function articleAdBreaks(blockCount: number, firstEvery = 8): number[] {
  const start = Math.max(1, firstEvery)
  if (blockCount < start + 1) return []
  return [blockCount - 1]
}

/**
 * Insert ads after named block indexes, only when more copy follows.
 * When `afterBlocks` is omitted, breaks come from `articleAdBreaks`.
 */
export function layoutArticleBody<A>(
  blocks: string[],
  ads: A[],
  afterBlocks?: readonly number[],
): ArticleChunk<A>[] {
  const marks = new Set(afterBlocks ?? articleAdBreaks(blocks.length))
  const out: ArticleChunk<A>[] = []
  let ai = 0
  for (let i = 0; i < blocks.length; i++) {
    out.push({ kind: 'html', html: blocks[i] as string })
    const n = i + 1
    const moreCopy = i < blocks.length - 1
    if (moreCopy && ai < ads.length && marks.has(n)) {
      out.push({ kind: 'ad', ad: ads[ai] as A })
      ai += 1
    }
  }
  return out
}
