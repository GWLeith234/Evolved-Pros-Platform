import type { Metadata } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { MediaSectionMagazine, type MediaSectionArticle } from '@/components/media/MediaSectionMagazine'

export const revalidate = 120

export const metadata: Metadata = publicPageMetadata('/media/ai-trends', {
  title: mediaSectionTitle('AI Trends'),
  description: 'Artificial intelligence trends shaping sales, marketing, and business strategy.',
})

async function fetchArticles(): Promise<MediaSectionArticle[]> {
  const { data, error } = await adminClient
    .from('media_stories')
    .select('id, title, slug, featured_image_url, pillar, section, published_at, body, author, excerpt')
    .eq('is_published', true)
    .eq('section', 'ai-trends')
    .order('published_at', { ascending: false })
    .limit(24)

  if (!error && data && data.length > 0) return data as MediaSectionArticle[]

  const { data: fallback } = await adminClient
    .from('media_stories')
    .select('id, title, slug, featured_image_url, pillar, section, published_at, body, author, excerpt')
    .eq('is_published', true)
    .contains('tags', ['ai-trends'])
    .order('published_at', { ascending: false })
    .limit(24)

  return (fallback ?? []) as MediaSectionArticle[]
}

export default async function AiTrendsPage() {
  const articles = await fetchArticles()
  return (
    <MediaSectionMagazine
      title="AI Trends"
      dividerLabel="Latest in AI Trends"
      articles={articles}
    />
  )
}
