import {
  SERIES_NAME,
  SITE_URL,
  episodeUrl,
  isoDuration,
  summaryText,
  transcriptParagraphs,
  ytThumb,
  type PublicEpisode,
} from '@/lib/podcast/public'
import { jsonLdScriptHtml } from '@/lib/seo/jsonld'

/**
 * PodcastEpisode + VideoObject + BreadcrumbList for `/podcast/[slug]`.
 * Titles, summaries, and transcripts come from the episodes table (admin CMS
 * and the podcast RSS sync). Serialize with jsonLdScriptHtml so a `</script>`
 * in that text cannot close the JSON-LD script tag.
 */
export function episodeJsonLd(ep: PublicEpisode) {
  const url = episodeUrl(ep.slug)
  const image = ytThumb(ep.youtube_id, 'max')
  const description = summaryText(ep)
  const duration = isoDuration(ep.duration_seconds)

  const podcastEpisode = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: ep.title,
    url,
    description,
    datePublished: ep.published_at ?? undefined,
    episodeNumber: ep.episode_number ?? undefined,
    duration,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: SERIES_NAME,
      url: `${SITE_URL}/podcast`,
    },
    ...(ep.youtube_id
      ? {
          associatedMedia: {
            '@type': 'MediaObject',
            contentUrl: `https://www.youtube.com/watch?v=${ep.youtube_id}`,
          },
        }
      : {}),
  }

  const video = ep.youtube_id
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: ep.title,
        description,
        thumbnailUrl: image ? [image] : undefined,
        uploadDate: ep.published_at ?? undefined,
        duration,
        embedUrl: `https://www.youtube-nocookie.com/embed/${ep.youtube_id}`,
        contentUrl: `https://www.youtube.com/watch?v=${ep.youtube_id}`,
        ...(ep.transcript_text && transcriptParagraphs(ep).length ? { transcript: ep.transcript_text } : {}),
      }
    : null

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Podcast', item: `${SITE_URL}/podcast` },
      { '@type': 'ListItem', position: 3, name: ep.title, item: url },
    ],
  }

  return [podcastEpisode, video, breadcrumb].filter(Boolean)
}

export function episodeJsonLdScript(ep: PublicEpisode): string {
  return jsonLdScriptHtml(episodeJsonLd(ep))
}
