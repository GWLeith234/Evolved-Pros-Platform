import type { Metadata } from 'next'
import { stripEmDashCopy } from '@/lib/home/cardImagery'
import { mediaStoryTitle } from '@/lib/media/brand'
import { lockedArticleByline, resolveStoryArtUrl } from '@/lib/media/storyArt'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/canonical'
import { fitMetaDescription, plainTextBlocks } from '@/lib/seo/metaDescription'
import type { MediaStoryRecord } from '@/lib/media/storyRecord'

export function mediaStoryHead(story: Pick<
  MediaStoryRecord,
  'title' | 'excerpt' | 'seo_title' | 'seo_description' | 'featured_image_url' | 'author' | 'slug'
>): { title: string; description: string; image: string; byline: string } {
  return {
    title: mediaStoryTitle(
      stripEmDashCopy(story.title),
      stripEmDashCopy(story.seo_title || ''),
      story.slug,
    ),
    description: stripEmDashCopy(story.seo_description || story.excerpt || ''),
    image: resolveStoryArtUrl(story.featured_image_url) || DEFAULT_OG_IMAGE,
    byline: lockedArticleByline(story),
  }
}

/**
 * Article meta description. A dek already in range is kept. A short dek
 * is extended with the excerpt and later body paragraphs. A long dek is
 * trimmed on a word boundary. Stored seo_description and body are not edited.
 */
export function publishedStoryDescription(
  story: Pick<MediaStoryRecord, 'seo_description' | 'excerpt' | 'body'>,
): string {
  const dek = stripEmDashCopy(story.seo_description || story.excerpt || '')
  const excerpt = story.excerpt ? stripEmDashCopy(story.excerpt) : ''
  const blocks = plainTextBlocks(story.body).map(block => stripEmDashCopy(block))
  return fitMetaDescription(dek, [excerpt, ...blocks])
}

/** OG / Twitter fields for the public article and the draft preview. */
export function mediaStorySocialMetadata(
  story: MediaStoryRecord,
  extra?: { robots?: Metadata['robots'] },
): Metadata {
  const head = mediaStoryHead(story)
  const description = publishedStoryDescription(story)
  return {
    title: head.title,
    description,
    ...(extra?.robots ? { robots: extra.robots } : {}),
    openGraph: {
      title: head.title,
      description,
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
      description,
      images: [head.image],
    },
  }
}

export const PREVIEW_ROBOTS: Metadata['robots'] = { index: false, follow: false }
