/**
 * Rows for /llms.txt. Same reads and filters as app/sitemap.ts.
 *
 * Inclusion is not decided here. buildLlmsTxt passes these rows to
 * toEpisodeSitemapEntries, toMediaSitemapEntries, and
 * toMediaCategoryLandingSitemapEntries. The story select adds title,
 * excerpt, and seo_description so each line can quote the stored page.
 * app/sitemap.ts is left unchanged so the lastmod work on that file
 * does not have to merge with this query.
 */

import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { getPublishedEpisodes } from '@/lib/podcast/public'
import type { MediaCategoryLandingSignals, MediaCategoryStoryRow } from '@/lib/seo/mediaCategoryLandings'
import type { LlmsCatalogue, LlmsStory } from '@/lib/seo/llmsTxt'

const STORY_COLUMNS =
  'pillar, slug, title, excerpt, seo_description, section, tags, published_at, updated_at, is_published'

async function countHead(
  run: () => PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number> {
  try {
    const { count, error } = await run()
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

async function loadPublishedEventTitles(): Promise<string[]> {
  try {
    const { data, error } = await adminClient
      .from('events')
      .select('title')
      .eq('is_published', true)
    if (error || !data) return []
    return data.map(row => row.title)
  } catch {
    return []
  }
}

/**
 * Counts mirror app/sitemap.ts loadMediaCategoryLandingSignals.
 * A failed count is zero, so that landing stays out.
 */
async function loadMediaCategoryLandingSignals(
  stories: readonly MediaCategoryStoryRow[],
): Promise<MediaCategoryLandingSignals> {
  const [
    communityPostCount,
    publishedEventTitles,
    publishedLessonCount,
    publishedCourseCount,
    publishedJobCount,
  ] = await Promise.all([
    countHead(() => adminClient.from('posts').select('id', { count: 'exact', head: true })),
    loadPublishedEventTitles(),
    countHead(() =>
      adminClient.from('lessons').select('id', { count: 'exact', head: true }).eq('is_published', true),
    ),
    countHead(() =>
      adminClient.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
    ),
    countHead(() =>
      adminClient.from('job_listings').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    ),
  ])

  return {
    stories,
    communityPostCount,
    publishedEventTitles,
    publishedLessonCount,
    publishedCourseCount,
    publishedJobCount,
  }
}

export async function loadLlmsCatalogue(): Promise<LlmsCatalogue> {
  let episodes: LlmsCatalogue['episodes'] = []
  try {
    const published = await getPublishedEpisodes()
    episodes = published.map(episode => ({
      slug: episode.slug,
      title: episode.title,
      summary: episode.summary,
      guest_name: episode.guest_name,
      published_at: episode.published_at,
      updated_at: episode.updated_at,
    }))
  } catch {
    episodes = []
  }

  let stories: LlmsStory[] = []
  try {
    const { data } = await adminClient
      .from('media_stories')
      .select(STORY_COLUMNS)
      .eq('is_published', true)
    stories = (data ?? []) as LlmsStory[]
  } catch {
    stories = []
  }

  let signals: MediaCategoryLandingSignals = {
    stories,
    communityPostCount: 0,
    publishedEventTitles: [],
    publishedLessonCount: 0,
    publishedCourseCount: 0,
    publishedJobCount: 0,
  }
  try {
    signals = await loadMediaCategoryLandingSignals(stories)
  } catch {
    // A category-landing query failure omits those URLs only.
  }

  return { episodes, stories, signals }
}
