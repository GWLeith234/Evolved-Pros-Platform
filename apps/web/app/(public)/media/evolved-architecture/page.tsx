import type { Metadata } from 'next'
import { cache } from 'react'
import { adminClient } from '@/lib/supabase/admin'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { mediaListingRobots } from '@/lib/seo/mediaListingRobots'
import { mediaMagazineCollection } from '@/lib/seo/mediaCollectionJsonLd'
import { MediaSectionMagazine, type MediaSectionArticle } from '@/components/media/MediaSectionMagazine'

const listing = mediaMagazineCollection('/media/evolved-architecture')

export const revalidate = 120

const fetchArticles = cache(async (): Promise<MediaSectionArticle[]> => {
  const { data } = await adminClient
    .from('media_stories')
    .select('id, title, slug, featured_image_url, pillar, section, published_at, body, author, excerpt')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(24)

  return (data ?? []) as MediaSectionArticle[]
})

export async function generateMetadata(): Promise<Metadata> {
  const articles = await fetchArticles()
  return publicPageMetadata(listing.path, {
    title: mediaSectionTitle(listing.name),
    description: listing.description,
    ...mediaListingRobots(articles.length),
  })
}

export default async function EvolvedArchitecturePage() {
  const articles = await fetchArticles()
  return (
    <MediaSectionMagazine
      path={listing.path}
      title={listing.name}
      description={listing.description}
      subtitle="Foundation · Identity · Mental Toughness · Strategy · Accountability · Execution"
      dividerLabel="All Pillars"
      articles={articles}
    />
  )
}
