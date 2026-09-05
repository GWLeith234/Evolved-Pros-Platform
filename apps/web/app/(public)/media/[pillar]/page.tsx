import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { MediaSectionMagazine, type MediaSectionArticle } from '@/components/media/MediaSectionMagazine'
import { PILLAR_CONFIG, getPillarLabel } from '@/lib/pillars'
import { moreInLabel } from '@/lib/media/desk'
import { listPublicMediaStories } from '@/lib/media/sitemap'

export const revalidate = 120
export const dynamicParams = true

const EXTRA_PILLARS = new Set(['general'])

function isKnownPillar(pillar: string): boolean {
  return Boolean(PILLAR_CONFIG[pillar]) || EXTRA_PILLARS.has(pillar)
}

export async function generateStaticParams() {
  return [...Object.keys(PILLAR_CONFIG), 'general'].map(pillar => ({ pillar }))
}

export async function generateMetadata(
  { params }: { params: { pillar: string } },
): Promise<Metadata> {
  if (!isKnownPillar(params.pillar)) return {}
  const label = params.pillar === 'general' ? 'Original' : getPillarLabel(params.pillar)
  return publicPageMetadata(`/media/${params.pillar}`, {
    title: mediaSectionTitle(label),
    description: `${label} stories from the Evolved Pros desk.`,
  })
}

async function fetchArticles(pillar: string): Promise<MediaSectionArticle[]> {
  const query = adminClient
    .from('media_stories')
    .select('id, title, slug, featured_image_url, pillar, published_at, body, author, excerpt, is_published')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(24)

  const { data } = pillar === 'general'
    ? await query.is('pillar', null)
    : await query.eq('pillar', pillar)

  return listPublicMediaStories((data ?? []) as Array<MediaSectionArticle & { is_published?: boolean | null }>)
}

export default async function MediaPillarPage({
  params,
}: {
  params: { pillar: string }
}) {
  if (!isKnownPillar(params.pillar)) return notFound()
  const articles = await fetchArticles(params.pillar)
  const label = params.pillar === 'general' ? 'Original' : getPillarLabel(params.pillar)
  return (
    <MediaSectionMagazine
      title={label}
      dividerLabel={moreInLabel(label)}
      articles={articles}
    />
  )
}
