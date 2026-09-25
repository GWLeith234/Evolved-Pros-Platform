/** Row shape shared by the public article and the draft preview. */

export type MediaStoryRecord = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body: string | null
  pillar: string | null
  story_type: string
  source_url: string | null
  source_name: string | null
  featured_image_url: string | null
  author: string | null
  seo_title: string | null
  seo_description: string | null
  tags: string[]
  is_published: boolean | null
  published_at: string | null
  updated_at: string | null
  created_at: string | null
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

export function asMediaStoryRecord(row: unknown): MediaStoryRecord | null {
  if (!row || typeof row !== 'object') return null
  const record = row as Record<string, unknown>
  if (typeof record.id !== 'string' || typeof record.title !== 'string' || typeof record.slug !== 'string') {
    return null
  }
  if (typeof record.story_type !== 'string') return null
  const tags = Array.isArray(record.tags)
    ? record.tags.filter((tag): tag is string => typeof tag === 'string')
    : []
  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    excerpt: str(record.excerpt),
    body: str(record.body),
    pillar: str(record.pillar),
    story_type: record.story_type,
    source_url: str(record.source_url),
    source_name: str(record.source_name),
    featured_image_url: str(record.featured_image_url),
    author: str(record.author),
    seo_title: str(record.seo_title),
    seo_description: str(record.seo_description),
    tags,
    is_published: typeof record.is_published === 'boolean' ? record.is_published : null,
    published_at: str(record.published_at),
    updated_at: str(record.updated_at),
    created_at: str(record.created_at),
  }
}
