/**
 * Content-gated /media category landings for the sitemap.
 *
 * Pillar hubs stay on MEDIA_PILLAR_HUB_PATHS. These landings are separate
 * routes (academy, events, and so on). Each one is listed only when the
 * same query that route renders would show at least one published story
 * or listing. Empty, "coming soon", and redirecting landings stay out.
 *
 * No lastModified. Same rule as the pillar hubs: a request-time clock is
 * never read here. Priority and changeFrequency match those hubs.
 */

import { withoutConquerLocal } from '@/lib/events/nextEvent'
import {
  isListedPublicMediaStory,
  listPublicMediaStories,
} from '@/lib/media/sitemap'
import { MEDIA_PILLAR_HUB_PATHS } from './publicRoutes'
import {
  MEDIA_PILLAR_HUB_CHANGE_FREQUENCY,
  MEDIA_PILLAR_HUB_SITEMAP_PRIORITY,
} from './sitemapEntries'

export type MediaCategoryStoryRow = {
  pillar: string | null
  slug: string | null
  section?: string | null
  tags?: string[] | null
  is_published?: boolean | null
}

export type MediaCategoryLandingSignals = {
  stories: readonly MediaCategoryStoryRow[]
  /** Rows the /media/community landing would load. The page does not filter status. */
  communityPostCount: number
  /** Published event titles, before the Conquer Local filter the events page applies. */
  publishedEventTitles: readonly string[]
  publishedLessonCount: number
  publishedCourseCount: number
  /** job_listings with status published. */
  publishedJobCount: number
}

/**
 * Never sitemap these, even if a story or listing exists.
 * /media/podcast is a redirect to /podcast (already a static sitemap path).
 * /media/preview is an unpublished preview surface.
 */
export const MEDIA_CATEGORY_LANDING_NEVER = [
  '/media/podcast',
  '/media/preview',
] as const

/** Story-section magazines. Included when a listable story matches section or tags. */
const STORY_SECTION_SLUGS = ['ai-trends', 'leadership', 'wellness'] as const

const PILLAR_HUB_PATHS = new Set<string>(MEDIA_PILLAR_HUB_PATHS)

function storyTags(story: MediaCategoryStoryRow): string[] {
  if (!Array.isArray(story.tags)) return []
  return story.tags.filter((tag): tag is string => typeof tag === 'string')
}

function storyFeedsSection(story: MediaCategoryStoryRow, section: string): boolean {
  if (story.section?.trim() === section) return true
  return storyTags(story).some(tag => tag.trim() === section)
}

function publishedListableStories(stories: readonly MediaCategoryStoryRow[]): MediaCategoryStoryRow[] {
  return stories.filter(story => story.is_published === true && isListedPublicMediaStory(story))
}

/**
 * /media/general queries pillar IS NULL, then drops any row the public
 * list rejects. A story needs a pillar to be listed, so a null-pillar row
 * does not render and must not open this landing.
 */
function generalLandingHasStory(stories: readonly MediaCategoryStoryRow[]): boolean {
  const nullPillar = stories.filter(
    story => story.is_published === true && !(story.pillar?.trim()),
  )
  return listPublicMediaStories(nullPillar).length > 0
}

function isAllowedCategoryPath(path: string): boolean {
  if ((MEDIA_CATEGORY_LANDING_NEVER as readonly string[]).includes(path)) return false
  if (path === '/media/preview' || path.startsWith('/media/preview/')) return false
  if (PILLAR_HUB_PATHS.has(path)) return false
  return path.startsWith('/media/')
}

/**
 * Category landing paths that currently have a published story or listing.
 * Stable order. /media/podcast and /media/preview are never returned.
 */
export function mediaCategoryLandingPaths(signals: MediaCategoryLandingSignals): string[] {
  const stories = publishedListableStories(signals.stories)
  const paths: string[] = []

  if (stories.length > 0) paths.push('/media/evolved-architecture')
  if (signals.communityPostCount > 0) paths.push('/media/community')
  if (signals.publishedLessonCount > 0 || signals.publishedCourseCount > 0) {
    paths.push('/media/academy')
  }
  const visibleEvents = withoutConquerLocal(
    signals.publishedEventTitles.map(title => ({ title })),
  )
  if (visibleEvents.length > 0) paths.push('/media/events')

  for (const section of STORY_SECTION_SLUGS) {
    if (stories.some(story => storyFeedsSection(story, section))) {
      paths.push(`/media/${section}`)
    }
  }

  if (signals.publishedJobCount > 0) paths.push('/media/careers')
  if (generalLandingHasStory(signals.stories)) paths.push('/media/general')

  return paths.filter(isAllowedCategoryPath)
}

/** Same shape as pillar hubs: weekly, priority 0.6, no lastModified. */
export function toMediaCategoryLandingSitemapEntries(
  base: string,
  signals: MediaCategoryLandingSignals,
) {
  return mediaCategoryLandingPaths(signals).map(path => ({
    url: `${base}${path}`,
    changeFrequency: MEDIA_PILLAR_HUB_CHANGE_FREQUENCY,
    priority: MEDIA_PILLAR_HUB_SITEMAP_PRIORITY,
  }))
}
