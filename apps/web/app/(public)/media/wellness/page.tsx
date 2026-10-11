import type { Metadata } from 'next'
import { cache } from 'react'
import { adminClient } from '@/lib/supabase/admin'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { mediaListingRobots } from '@/lib/seo/mediaListingRobots'
import { mediaMagazineCollection } from '@/lib/seo/mediaCollectionJsonLd'
import { MediaSectionMagazine, type MediaSectionArticle } from '@/components/media/MediaSectionMagazine'

const listing = mediaMagazineCollection('/media/wellness')

export const revalidate = 120

const fetchArticles = cache(async (): Promise<MediaSectionArticle[]> => {
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
})

export async function generateMetadata(): Promise<Metadata> {
  const articles = await fetchArticles()
  return publicPageMetadata(listing.path, {
    title: mediaSectionTitle(listing.name),
    description: listing.description,
    ...mediaListingRobots(articles.length),
  })
}

export default async function WellnessPage() {
  const articles = await fetchArticles()
  return (
    <MediaSectionMagazine
      path={listing.path}
      title={listing.name}
      description={listing.description}
      dividerLabel="Latest in Wellness"
      articles={articles}
    />
  )
}
