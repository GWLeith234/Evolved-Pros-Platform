import type { Metadata } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { MediaSectionMagazine, type MediaSectionArticle } from '@/components/media/MediaSectionMagazine'

export const revalidate = 120

export const metadata: Metadata = publicPageMetadata('/media/wellness', {
  title: mediaSectionTitle('Wellness'),
  description: 'Physical and mental wellness strategies for high-performing professionals.',
})

async function fetchArticles(): Promise<MediaSectionArticle[]> {
  const { data, error } = await adminClient
    .from('media_stories')
    .select('id, title, slug, featured_image_url, pillar, section, published_at, body, author, excerpt')
    .eq('is_published', true)
    .eq('section', 'wellness')
    .order('published_at', { ascending: false })
    .limit(24)

  if (!error && data && data.length > 0) return data as MediaSectionArticle[]

  const { data: fallback } = await adminClient
    .from('media_stories')
    .select('id, title, slug, featured_image_url, pillar, section, published_at, body, author, excerpt')
    .eq('is_published', true)
    .contains('tags', ['wellness'])
    .order('published_at', { ascending: false })
    .limit(24)

  return (fallback ?? []) as MediaSectionArticle[]
}

export default async function WellnessPage() {
  const articles = await fetchArticles()
  return (
    <MediaSectionMagazine
      title="Wellness"
      dividerLabel="Latest in Wellness"
      articles={articles}
    />
  )
}
