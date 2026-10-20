/**
 * Columns a media-story editor may change.
 * Matches POST /api/admin/media and the admin story form.
 * Everything else on media_stories is server-owned.
 */
export const MEDIA_STORY_WRITABLE_FIELDS = [
  'title',
  'slug',
  'excerpt',
  'body',
  'pillar',
  'story_type',
  'source_url',
  'source_name',
  'featured_image_url',
  'author',
  'seo_title',
  'seo_description',
  'tags',
  'is_featured',
  'is_published',
] as const

/**
 * Present on media_stories, absent from the editor payload, and not safe to
 * take from a request body. views ranks the public desk. status is the
 * draft/review/published workflow flag. published_at is stamped here only
 * when the allowlisted patch sets is_published to true.
 */
export const MEDIA_STORY_DENIED_FIELDS = [
  'id',
  'created_at',
  'updated_at',
  'published_at',
  'views',
  'status',
  'ai_draft',
  'ai_research_brief',
  'seo_meta_description',
  'unsplash_photo_id',
  'section',
  'category_type',
] as const

export function mediaStoryUpdateFromBody(
  body: Record<string, unknown>,
  nowIso: string,
): Record<string, unknown> {
  const update: Record<string, unknown> = {}
  for (const key of MEDIA_STORY_WRITABLE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue
    const value = body[key]
    if (key === 'featured_image_url' && typeof value === 'string') {
      update.featured_image_url = value.trim() || null
    } else {
      update[key] = value
    }
  }
  if (update.is_published === true) {
    update.published_at = nowIso
  }
  return update
}
