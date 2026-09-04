import type { Metadata } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { MediaSectionMagazine, type MediaSectionArticle } from '@/components/media/MediaSectionMagazine'

export const revalidate = 120

export const metadata: Metadata = publicPageMetadata('/media/leadership', {
  title: mediaSectionTitle('Leadership'),
  description: 'Leadership insights, management strategy, and executive development.',
})

async function fetchArticles(): Promise<MediaSectionArticle[]> {
  const { data, error } = await adminClient
    .from('media_stories')
    .select('id, title, slug, featured_image_url, pillar, section, published_at, body, author, excerpt')
    .eq('is_published', true)
    .eq('section', 'leadership')
    .order('published_at', { ascending: false })
    .limit(24)

  if (!error && data && data.length > 0) return data as MediaSectionArticle[]

  const { data: fallback } = await adminClient
    .from('media_stories')
    .select('id, title, slug, featured_image_url, pillar, section, published_at, body, author, excerpt')
    .eq('is_published', true)
    .contains('tags', ['leadership'])
    .order('published_at', { ascending: false })
    .limit(24)

  return (fallback ?? []) as MediaSectionArticle[]
}

export default async function LeadershipPage() {
  const articles = await fetchArticles()
  return (
    <MediaSectionMagazine
      title="Leadership"
      dividerLabel="Latest in Leadership"
      articles={articles}
    />
  )
}
