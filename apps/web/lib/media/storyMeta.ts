import type { Metadata } from 'next'
import { stripEmDashCopy } from '@/lib/home/cardImagery'
import { mediaStoryTitle } from '@/lib/media/brand'
import { lockedArticleByline, resolveStoryArtUrl } from '@/lib/media/storyArt'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/canonical'
import { articleSearchSnippet, fitMetaDescription, joinEmDashClause, plainTextBlocks } from '@/lib/seo/metaDescription'
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
    description: descriptionCopy(story.seo_description || story.excerpt || ''),
    image: resolveStoryArtUrl(story.featured_image_url) || DEFAULT_OG_IMAGE,
    byline: lockedArticleByline(story),
  }
}

/**
 * Article meta description. A dek already in range is kept. A short dek
 * is extended with the excerpt and later body paragraphs. A long dek is
 * trimmed on a word boundary. Stored seo_description and body are not edited.
 *
 * An em dash before a lowercase word becomes a comma. A dash before a
 * capital still becomes a period. That stops "keep — and" publishing as
 * "keep. and".
 */
function descriptionCopy(copy: string): string {
  return stripEmDashCopy(joinEmDashClause(copy))
}

function storySnippetPath(story: Pick<MediaStoryRecord, 'pillar' | 'slug'>): string {
  const pillar = story.pillar?.trim() || 'general'
  return `/media/${pillar}/${story.slug}`
}

export function publishedStoryDescription(
  story: Pick<MediaStoryRecord, 'seo_description' | 'excerpt' | 'body'>,
): string {
  const dek = descriptionCopy(story.seo_description || story.excerpt || '')
  const excerpt = story.excerpt ? descriptionCopy(story.excerpt) : ''
  const blocks = plainTextBlocks(story.body).map(block => descriptionCopy(block))
  return fitMetaDescription(dek, [excerpt, ...blocks])
}

/** OG / Twitter fields for the public article and the draft preview. */
export function mediaStorySocialMetadata(
  story: MediaStoryRecord,
  extra?: { robots?: Metadata['robots'] },
): Metadata {
  const head = mediaStoryHead(story)
  const description = articleSearchSnippet(storySnippetPath(story)) ?? publishedStoryDescription(story)
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
