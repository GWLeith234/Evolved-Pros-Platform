/**
 * Listing lastmod for hubs. Rows are already fetched; this module does
 * not touch Supabase or the clock.
 *
 * A hub date is the newest stored stamp of the rows that page renders.
 * When those rows have no stamp, it falls back to the newest stamp in
 * the same table. The shell constant is applied by the caller only when
 * both are empty.
 */

import { listPublicMediaStories } from '@/lib/media/sitemap'
import {
  HOME_LISTED_EPISODES,
  HOME_LISTED_STORIES,
  MEDIA_HUB_EPISODE_LISTING_LIMIT,
  MEDIA_SECTION_LISTING_LIMIT,
  PODCAST_INDEX_LISTING_LIMIT,
  PILLAR_HUB_SHELL_LAST_MODIFIED,
  byPublishedDesc,
  copyLastModified,
  hubLastModified,
  listingLastModified,
  newestRowLastModified,
  staticPageLastModified,
  type EpisodeSitemapRow,
  type SitemapDatedRow,
} from './sitemapEntries'
import {
  MEDIA_PILLAR_HUB_PATHS,
  type MediaPillarHubPath,
  type PublicSitemapPath,
} from './publicRoutes'

export type ListingStoryRow = {
  pillar: string | null
  slug: string | null
  is_published?: boolean | null
  published_at?: string | null
  updated_at?: string | null
}

/** Published, denylist-clean stories, newest published_at first. */
export function orderedPublicStories<T extends ListingStoryRow>(stories: readonly T[]): T[] {
  return [...listPublicMediaStories(stories.filter(story => story.is_published === true))].sort(byPublishedDesc)
}

export function homeListingLastModified(input: {
  /** Newest-published first, the order getPublishedEpisodes returns. */
  episodes: readonly EpisodeSitemapRow[]
  stories: readonly ListingStoryRow[]
  /**
   * Published fit guides in rotator order (featured first). The home
   * tease renders the first card. The rest are the data-source fallback.
   */
  fitMoves: readonly SitemapDatedRow[]
}): Date | undefined {
  const stories = orderedPublicStories(input.stories)
  const listed = [
    ...input.episodes.slice(0, HOME_LISTED_EPISODES),
    ...stories.slice(0, HOME_LISTED_STORIES),
    ...input.fitMoves.slice(0, 1),
  ]
  return listingLastModified(listed, [...input.episodes, ...stories, ...input.fitMoves])
}

export function podcastListingLastModified(
  episodes: readonly EpisodeSitemapRow[],
): Date | undefined {
  return listingLastModified(
    episodes.slice(0, PODCAST_INDEX_LISTING_LIMIT),
    episodes,
  )
}

export function mediaHubListingLastModified(
  stories: readonly ListingStoryRow[],
  episodes: readonly EpisodeSitemapRow[],
): Date | undefined {
  const listedStories = orderedPublicStories(stories)
  return listingLastModified(
    [...listedStories, ...episodes.slice(0, MEDIA_HUB_EPISODE_LISTING_LIMIT)],
    [...listedStories, ...episodes],
  )
}

/**
 * Per pillar: the page loads 24 newest-published rows, then drops anything
 * the public list rejects. An edit outside that window does not change the
 * hub, so it does not move lastmod while the window itself has a stamp.
 */
export function pillarHubLastModifiedMap(
  stories: readonly ListingStoryRow[],
): Partial<Record<MediaPillarHubPath, Date>> {
  const dates: Partial<Record<MediaPillarHubPath, Date>> = {}
  for (const path of MEDIA_PILLAR_HUB_PATHS) {
    const pillar = path.slice('/media/'.length)
    const published = stories.filter(
      story => story.is_published === true && story.pillar?.trim() === pillar,
    )
    const window = [...published].sort(byPublishedDesc).slice(0, MEDIA_SECTION_LISTING_LIMIT)
    const date = listingLastModified(
      listPublicMediaStories(window),
      listPublicMediaStories(published),
    )
    if (date) dates[path] = date
  }
  return dates
}

export function staticSitemapLastModified(input: {
  episodes: readonly EpisodeSitemapRow[]
  stories: readonly ListingStoryRow[]
  fitMoves: readonly SitemapDatedRow[]
  pricingContent?: Date
  liveContent?: Date
}): Record<PublicSitemapPath, Date> {
  const resolved = {
    '/': hubLastModified(
      homeListingLastModified(input),
      copyLastModified('/').toISOString(),
    ),
    '/podcast': hubLastModified(
      podcastListingLastModified(input.episodes),
      copyLastModified('/podcast').toISOString(),
    ),
    '/live': staticPageLastModified('/live', input.liveContent),
    '/media': hubLastModified(
      mediaHubListingLastModified(input.stories, input.episodes),
      copyLastModified('/media').toISOString(),
    ),
    '/fit': staticPageLastModified('/fit', newestRowLastModified(input.fitMoves)),
    '/pricing': staticPageLastModified('/pricing', input.pricingContent),
    '/terms': copyLastModified('/terms'),
    '/privacy': copyLastModified('/privacy'),
    '/contact': copyLastModified('/contact'),
    '/about': copyLastModified('/about'),
    '/evolved': copyLastModified('/evolved'),
    '/extension-privacy': copyLastModified('/extension-privacy'),
    '/sales-coaching': copyLastModified('/sales-coaching'),
    '/sales-quota': copyLastModified('/sales-quota'),
    '/sales-burnout': copyLastModified('/sales-burnout'),
  } satisfies Record<PublicSitemapPath, Date>

  return resolved
}

export { PILLAR_HUB_SHELL_LAST_MODIFIED }
