/**
 * Content-gated /media category landings for the sitemap.
 *
 * Pillar hubs stay on MEDIA_PILLAR_HUB_PATHS. These landings are separate
 * routes (academy, events, and so on). Each one is listed only when the
 * same query that route renders would show at least one published story
 * or listing. Empty, "coming soon", and redirecting landings stay out.
 *
 * lastModified is the newest stored stamp of the rows that landing
 * renders, then the newest stamp in that landing's source. A shell
 * constant fills in only when both are empty. The clock is never read.
 * Priority and changeFrequency match the pillar hubs.
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
  MEDIA_SECTION_LISTING_LIMIT,
  byCreatedDesc,
  byPublishedDesc,
  categoryLandingShell,
  hubLastModified,
  listingLastModified,
  type SitemapDatedRow,
} from './sitemapEntries'

export type MediaCategoryStoryRow = {
  pillar: string | null
  slug: string | null
  section?: string | null
  tags?: string[] | null
  is_published?: boolean | null
  published_at?: string | null
  updated_at?: string | null
}

export type MediaCategoryLandingSignals = {
  stories: readonly MediaCategoryStoryRow[]
  /** Rows the /media/community landing would load. The page does not filter status. */
  communityPostCount: number
  /**
   * Posts the community page lists: like_count desc, limit 8.
   * Stamps only. Omitted in fixtures that only check inclusion.
   */
  communityListedPosts?: readonly SitemapDatedRow[]
  /** Newest post in the table, used when the listed rows have no stamp. */
  communitySourcePosts?: readonly SitemapDatedRow[]
  /** Published event titles, before the Conquer Local filter the events page applies. */
  publishedEventTitles: readonly string[]
  /**
   * Published events. created_at is the record stamp (events has no
   * updated_at). The upcoming/past split on the page depends on the
   * request clock, so lastmod uses the whole published catalogue after
   * the Conquer Local filter instead of that split.
   */
  publishedEvents?: readonly (SitemapDatedRow & { title: string })[]
  publishedLessonCount: number
  /** Published lessons. The page features the newest created_at. */
  academyLessons?: readonly SitemapDatedRow[]
  publishedCourseCount: number
  /** Published courses. The page lists every one. */
  academyCourses?: readonly SitemapDatedRow[]
  /** job_listings with status published. */
  publishedJobCount: number
  /** Published job rows. updated_at, else created_at. */
  publishedJobs?: readonly SitemapDatedRow[]
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

function publishedStories(stories: readonly MediaCategoryStoryRow[]): MediaCategoryStoryRow[] {
  return stories.filter(story => story.is_published === true)
}

/** Magazine page: section column wins; tags are the fallback query. */
function sectionMagazineLastModified(
  stories: readonly MediaCategoryStoryRow[],
  section: string,
): Date | undefined {
  const published = publishedStories(stories)
  const bySection = published.filter(story => story.section?.trim() === section)
  const pool = bySection.length > 0
    ? bySection
    : published.filter(story => storyTags(story).some(tag => tag.trim() === section))
  const ordered = [...pool].sort(byPublishedDesc)
  return listingLastModified(ordered.slice(0, MEDIA_SECTION_LISTING_LIMIT), pool)
}

function evolvedArchitectureLastModified(
  stories: readonly MediaCategoryStoryRow[],
): Date | undefined {
  const published = publishedStories(stories)
  const ordered = [...published].sort(byPublishedDesc)
  return listingLastModified(ordered.slice(0, MEDIA_SECTION_LISTING_LIMIT), published)
}

function generalLandingLastModified(
  stories: readonly MediaCategoryStoryRow[],
): Date | undefined {
  const nullPillar = stories.filter(
    story => story.is_published === true && !(story.pillar?.trim()),
  )
  const ordered = [...nullPillar].sort(byPublishedDesc)
  const window = ordered.slice(0, MEDIA_SECTION_LISTING_LIMIT)
  return listingLastModified(
    listPublicMediaStories(window),
    listPublicMediaStories(nullPillar),
  )
}

function communityLastModified(signals: MediaCategoryLandingSignals): Date | undefined {
  return listingLastModified(
    signals.communityListedPosts ?? [],
    signals.communitySourcePosts ?? signals.communityListedPosts ?? [],
  )
}

function academyLastModified(signals: MediaCategoryLandingSignals): Date | undefined {
  const lessons = [...(signals.academyLessons ?? [])].sort(byCreatedDesc)
  const courses = signals.academyCourses ?? []
  return listingLastModified(
    [...lessons.slice(0, 1), ...courses],
    [...lessons, ...courses],
  )
}

function eventsLastModified(signals: MediaCategoryLandingSignals): Date | undefined {
  const visible = withoutConquerLocal(signals.publishedEvents ?? [])
  return listingLastModified(visible, visible)
}

function careersLastModified(signals: MediaCategoryLandingSignals): Date | undefined {
  const jobs = signals.publishedJobs ?? []
  return listingLastModified(jobs, jobs)
}

/** Newest child stamp for one landing, before the shell fallback. */
export function categoryLandingContentDate(
  path: string,
  signals: MediaCategoryLandingSignals,
): Date | undefined {
  if (path === '/media/evolved-architecture') return evolvedArchitectureLastModified(signals.stories)
  if (path === '/media/community') return communityLastModified(signals)
  if (path === '/media/academy') return academyLastModified(signals)
  if (path === '/media/events') return eventsLastModified(signals)
  if (path === '/media/careers') return careersLastModified(signals)
  if (path === '/media/general') return generalLandingLastModified(signals.stories)
  const section = path.startsWith('/media/') ? path.slice('/media/'.length) : ''
  if (section) return sectionMagazineLastModified(signals.stories, section)
  return undefined
}

/** Same shape as pillar hubs: weekly, priority 0.6, plus a stored lastModified. */
export function toMediaCategoryLandingSitemapEntries(
  base: string,
  signals: MediaCategoryLandingSignals,
) {
  return mediaCategoryLandingPaths(signals).map(path => ({
    url: `${base}${path}`,
    lastModified: hubLastModified(categoryLandingContentDate(path, signals), categoryLandingShell(path)),
    changeFrequency: MEDIA_PILLAR_HUB_CHANGE_FREQUENCY,
    priority: MEDIA_PILLAR_HUB_SITEMAP_PRIORITY,
  }))
}
