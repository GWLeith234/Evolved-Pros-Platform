import { allowedEpisodeStillUrl } from '@/lib/podcast/stillUrl'

/**
 * Media "Latest Podcast" rail — stored destinations and stored stills only.
 * Never invent a YouTube URL. Never synthesize a face.
 */

export type MediaRailEpisode = {
  id: string
  episode_number: number
  title: string
  slug: string
  guest_image_url?: string | null
  thumbnail_url?: string | null
  youtube_url?: string | null
  duration_seconds?: number | null
}

function isStoredYoutubeUrl(url: string): boolean {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`)
    const host = u.hostname.toLowerCase().replace(/^www\./, '')
    return host === 'youtu.be' || host.endsWith('youtube.com')
  } catch {
    return false
  }
}

/** Stored YouTube URL when present and real; otherwise the platform episode page. Never '#'. */
export function episodeWatchHref(ep: Pick<MediaRailEpisode, 'youtube_url' | 'slug'>): string {
  const raw = ep.youtube_url?.trim()
  if (raw && isStoredYoutubeUrl(raw)) {
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  }
  const slug = ep.slug?.trim()
  return slug ? `/podcast/${slug}` : '/podcast'
}

export function episodeWatchIsExternal(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

/** Guest still first, episode thumbnail second. Never CloudFront. Null if neither is allowed. */
export function episodeRailStill(
  ep: Pick<MediaRailEpisode, 'guest_image_url' | 'thumbnail_url' | 'slug' | 'episode_number'>,
): string | null {
  return allowedEpisodeStillUrl({
    guest_image_url: ep.guest_image_url,
    thumbnail_url: ep.thumbnail_url,
    slug: ep.slug,
    episode_number: ep.episode_number,
  })
}

export function formatRailDuration(seconds: number | null | undefined): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
