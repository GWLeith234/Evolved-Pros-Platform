import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { asMediaStoryRecord, type MediaStoryRecord } from '@/lib/media/storyRecord'
import { mediaStorySocialMetadata } from '@/lib/media/storyMeta'
import { MediaStoryDocument } from '@/components/media/MediaStoryDocument'
import { publicPageMetadata } from '@/lib/seo/canonical'

export const revalidate = 3600
export const dynamicParams = true

async function fetchStory(pillar: string, slug: string): Promise<MediaStoryRecord | null> {
  const query = adminClient
    .from('media_stories')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
  const { data } = pillar === 'general'
    ? await query.is('pillar', null).maybeSingle()
    : await query.eq('pillar', pillar).maybeSingle()
  return asMediaStoryRecord(data)
}

export async function generateStaticParams() {
  const { data } = await adminClient
    .from('media_stories')
    .select('pillar, slug')
    .eq('is_published', true)
  return (data ?? [])
    .filter(s => s.slug)
    .map(s => ({ pillar: s.pillar ? String(s.pillar) : 'general', slug: String(s.slug) }))
}

export async function generateMetadata(
  { params }: { params: { pillar: string; slug: string } },
): Promise<Metadata> {
  const story = await fetchStory(params.pillar, params.slug)
  if (!story) notFound()
  return publicPageMetadata(
    `/media/${params.pillar}/${params.slug}`,
    mediaStorySocialMetadata(story),
  )
}

export default async function StoryPage({
  params,
}: {
  params: { pillar: string; slug: string }
}) {
  const story = await fetchStory(params.pillar, params.slug)
  if (!story) return notFound()

  if (story.story_type === 'redirect' && story.source_url) {
    redirect(story.source_url)
  }

  return (
    <MediaStoryDocument
      story={story}
      routePillar={params.pillar}
      routeSlug={params.slug}
    />
  )
}
