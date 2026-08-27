/**
 * Public /media hub data. Same contract as getPublishedEpisodes:
 * adminClient server-side so ISR/build and anonymous Googlebot requests
 * do not depend on cookie-scoped anon RLS. The is_published filter and
 * unpublished-slug denylist still apply — this is not an unfiltered dump.
 */
import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { listPublicMediaStories } from './sitemap'

export const MEDIA_HUB_STORY_COLUMNS =
  'id, title, slug, excerpt, pillar, story_type, featured_image_url, author, published_at, body, views, is_published'

export type HubMediaStory = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  pillar: string | null
  story_type: string
  featured_image_url: string | null
  author: string | null
  published_at: string | null
  body: string | null
  views: number
  is_published?: boolean | null
}

/** Every published, denylist-clean story the /media hub may link to. */
export async function getPublishedMediaStoriesForHub(): Promise<HubMediaStory[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient as any)
      .from('media_stories')
      .select(MEDIA_HUB_STORY_COLUMNS)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
    if (error || !data) return []
    return listPublicMediaStories(data as HubMediaStory[])
  } catch {
    // A DB hiccup must not blank the hub chrome — the crawl index just
    // won't have article hrefs for this response.
    return []
  }
}
