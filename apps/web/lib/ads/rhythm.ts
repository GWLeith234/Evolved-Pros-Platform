/**
 * One ad grammar for the platform — Village / SooToday punctuation.
 *
 * Story (or curriculum, or feed) is the page. Ads are single units that
 * appear between real content. Never two or more units with only an
 * Advertisement label between them. Leftover inventory is not dumped
 * as a footer pair or a 2×2 board.
 */

/** Magazine is 3-up; punctuation is one unit after each row. */
export const MAGAZINE_ROW = 3
export const FEED_AD_EVERY = 3
/** Podcast archive lock: 4 episode cards, then a big box, then 4, then a box. */
export const PODCAST_AD_EVERY = 4
/** Community feed: one unit after a short run of posts. */
export const COMMUNITY_AD_EVERY = 3
/** Academy course grid is 3-up; one unit after a filled row. */
export const ACADEMY_COURSE_EVERY = 3
/** In-body units at scroll-depth breaks on a long article. */
export const ARTICLE_AD_AFTER = [3, 6, 9, 12, 16] as const

export type RhythmChunk<T, A> =
  | { kind: 'content'; items: T[] }
  | { kind: 'ad'; ad: A }

export type ArticleChunk<A> =
  | { kind: 'html'; html: string }
  | { kind: 'ad'; ad: A }

/**
 * Walk items in groups of `every`. Insert one ad after a group only when
 * another content group follows — unless `trailing` is on, in which case
 * a single unit may follow the last content group. Never adjacent ads.
 */
export function interleaveAds<T, A>(
  items: T[],
  ads: A[],
  every = FEED_AD_EVERY,
  options?: { trailing?: boolean },
): RhythmChunk<T, A>[] {
  const size = Math.max(1, every)
  const trailing = options?.trailing ?? false
  const chunks: RhythmChunk<T, A>[] = []
  let ai = 0

  for (let i = 0; i < items.length; i += size) {
    const group = items.slice(i, i + size)
    chunks.push({ kind: 'content', items: group })
    const hasMoreContent = i + size < items.length
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
 * Insert one ad after listed block counts, only when more copy follows.
 * A short piece gets zero or one unit; a long piece takes several.
 */
export function layoutArticleBody<A>(
  blocks: string[],
  ads: A[],
  afterBlocks: readonly number[] = ARTICLE_AD_AFTER,
): ArticleChunk<A>[] {
  const out: ArticleChunk<A>[] = []
  let ai = 0
  for (let i = 0; i < blocks.length; i++) {
    out.push({ kind: 'html', html: blocks[i] as string })
    const n = i + 1
    const moreCopy = i < blocks.length - 1
    if (moreCopy && ai < ads.length && afterBlocks.includes(n)) {
      out.push({ kind: 'ad', ad: ads[ai] as A })
      ai += 1
    }
  }
  return out
}
