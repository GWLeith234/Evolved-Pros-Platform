import 'server-only'
import { cache } from 'react'
import { adminClient } from '@/lib/supabase/admin'
import { asMediaStoryRecord, type MediaStoryRecord } from '@/lib/media/storyRecord'
import { unpublishedStories } from '@/lib/media/previewWeek'
import { isSignedInAdminCached } from '@/lib/media/previewSession'
import { previewAccessStatus } from '@/lib/media/previewToken'

const INDEX_COLUMNS =
  'id, title, slug, excerpt, pillar, featured_image_url, author, updated_at, created_at, published_at, is_published, story_type, body, source_url, source_name, seo_title, seo_description, tags'

export type PreviewIndexStory = Pick<
  MediaStoryRecord,
  | 'id'
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'pillar'
  | 'featured_image_url'
  | 'author'
  | 'updated_at'
  | 'created_at'
  | 'published_at'
  | 'is_published'
>

/** Any media_stories row with this slug, published or not. */
export const getMediaStoryBySlug = cache(async (slug: string): Promise<MediaStoryRecord | null> => {
  const { data, error } = await adminClient
    .from('media_stories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) return null
  return asMediaStoryRecord(data)
})

export async function listUnpublishedMediaStories(): Promise<PreviewIndexStory[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('media_stories')
    .select(INDEX_COLUMNS)
    .order('updated_at', { ascending: false })
  if (error || !data) return []
  return unpublishedStories(data as PreviewIndexStory[])
}

export const authorizeMediaPreview = cache(async (
  scope: 'story' | 'week',
  subject: string,
  token: string,
): Promise<boolean> => {
  const isAdmin = await isSignedInAdminCached()
  if (scope === 'story') {
    return previewAccessStatus({
      isAdmin,
      token: token || null,
      scope,
      slug: subject,
    }) === 200
  }
  return previewAccessStatus({
    isAdmin,
    token: token || null,
    scope,
    week: subject,
  }) === 200
})
