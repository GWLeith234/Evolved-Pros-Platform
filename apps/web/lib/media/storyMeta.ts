import type { Metadata } from 'next'
import { stripEmDashCopy } from '@/lib/home/cardImagery'
import { mediaStoryTitle } from '@/lib/media/brand'
import { lockedArticleByline, resolveStoryArtUrl } from '@/lib/media/storyArt'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/canonical'
import type { MediaStoryRecord } from '@/lib/media/storyRecord'

export function mediaStoryHead(story: Pick<
  MediaStoryRecord,
  'title' | 'excerpt' | 'seo_title' | 'seo_description' | 'featured_image_url' | 'author' | 'slug'
>): { title: string; description: string; image: string; byline: string } {
  return {
    title: stripEmDashCopy(story.seo_title || mediaStoryTitle(story.title)),
    description: stripEmDashCopy(story.seo_description || story.excerpt || ''),
    image: resolveStoryArtUrl(story.featured_image_url) || DEFAULT_OG_IMAGE,
    byline: lockedArticleByline(story),
  }
}

/** OG / Twitter fields for the public article and the draft preview. */
export function mediaStorySocialMetadata(
  story: MediaStoryRecord,
  extra?: { robots?: Metadata['robots'] },
): Metadata {
  const head = mediaStoryHead(story)
  return {
    title: head.title,
    description: head.description,
    ...(extra?.robots ? { robots: extra.robots } : {}),
    openGraph: {
      title: head.title,
      description: head.description,
      type: 'article',
      publishedTime: story.published_at ?? undefined,
      modifiedTime: story.updated_at ?? undefined,
      authors: [head.byline],
      tags: story.tags ?? [],
      images: [{ url: head.image, width: 1200, height: 630, alt: story.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: head.title,
      description: head.description,
      images: [head.image],
    },
  }
}

export const PREVIEW_ROBOTS: Metadata['robots'] = { index: false, follow: false }
