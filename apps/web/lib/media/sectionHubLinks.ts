/**
 * Which published stories a /media/[pillar] hub links.
 *
 * The desk (lede, secondary, Featured 2-up, Latest) plus Most Read still
 * paint the first MEDIA_SECTION_LISTING_LIMIT rows. That window is what
 * meta description, robots, and CollectionPage JSON-LD already use.
 * Everything published past those cards is appended to Latest so a crawler
 * can reach it with a plain <a href>. Noindex and unpublished denylist
 * paths are not added.
 */

import { popularStories, splitSectionDesk, type DeskStory } from '@/lib/media/desk'
import { SECTION_LATEST_LIST } from '@/lib/media/scrollInventory'
import {
  listPublicMediaStories,
  mediaArticlePath,
  NOINDEX_MEDIA_PATHS,
  UNPUBLISHED_MEDIA_PATHS,
} from '@/lib/media/sitemap'
import { MEDIA_SECTION_LISTING_LIMIT } from '@/lib/seo/sitemapEntries'

/** NewspaperMostRead calls popularStories(stories, 5). Keep the same length. */
export const SECTION_HUB_MOST_READ = 5

export type SectionHubRow = DeskStory & {
  slug: string | null
  is_published?: boolean | null
}

/** Story ids the first-page desk and Most Read already link. */
export function sectionLandingLinkedIds(landingWindow: readonly SectionHubRow[]): Set<string> {
  const desk = splitSectionDesk(landingWindow, { latestList: SECTION_LATEST_LIST })
  const ids = new Set<string>()
  for (const story of [desk.featured, desk.secondary, ...desk.featuredGrid, ...desk.latestList]) {
    if (story) ids.add(story.id)
  }
  for (const story of popularStories(landingWindow, SECTION_HUB_MOST_READ)) {
    ids.add(story.id)
  }
  return ids
}

/** Noindex and unpublished-denylist paths must not gain a hub link. */
export function sectionHubPathHidden(story: {
  pillar: string | null | undefined
  slug: string | null | undefined
}): boolean {
  const path = mediaArticlePath(story.pillar, story.slug)
  if (!path) return true
  return NOINDEX_MEDIA_PATHS.has(path) || UNPUBLISHED_MEDIA_PATHS.has(path)
}

/**
 * Published stories the landing window does not already link.
 * `landingWindow` is the same array the desk renders.
 */
export function sectionHubOverflowStories<T extends SectionHubRow>(
  stories: readonly T[],
  landingWindow: readonly T[],
): T[] {
  const linked = sectionLandingLinkedIds(landingWindow)
  return stories.filter(story => !linked.has(story.id) && !sectionHubPathHidden(story))
}

/**
 * Split a newest-first published query into the existing desk window and
 * the stories that window does not link.
 *
 * The window is the first MEDIA_SECTION_LISTING_LIMIT rows, then the public
 * list filter. That matches the old `.limit(24)` query. Filtering the full
 * list first would backfill the desk when a denylisted row sat in that
 * window and would move the first-page cards.
 */
export function sectionHubLinkPlan<T extends SectionHubRow>(
  rowsNewestFirst: readonly T[],
): { articles: T[]; overflow: T[] } {
  const articles = listPublicMediaStories(rowsNewestFirst.slice(0, MEDIA_SECTION_LISTING_LIMIT))
  const listed = listPublicMediaStories(rowsNewestFirst.slice())
  return {
    articles,
    overflow: sectionHubOverflowStories(listed, articles),
  }
}
