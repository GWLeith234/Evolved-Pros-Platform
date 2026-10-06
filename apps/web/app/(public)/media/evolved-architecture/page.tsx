import type { Metadata } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { mediaMagazineCollection } from '@/lib/seo/mediaCollectionJsonLd'
import { MediaSectionMagazine, type MediaSectionArticle } from '@/components/media/MediaSectionMagazine'

const listing = mediaMagazineCollection('/media/evolved-architecture')

export const revalidate = 120

export const metadata: Metadata = publicPageMetadata(listing.path, {
  title: mediaSectionTitle(listing.name),
  description: listing.description,
})

async function fetchArticles(): Promise<MediaSectionArticle[]> {
  const { data } = await adminClient
    .from('media_stories')
    .select('id, title, slug, featured_image_url, pillar, section, published_at, body, author, excerpt')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(24)

  return (data ?? []) as MediaSectionArticle[]
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
