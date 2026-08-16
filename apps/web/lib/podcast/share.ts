/** Client helpers for podcast episode Save / Share actions. */

const SAVED_KEY = 'ep_podcast_saved'

export function episodeSharePath(slug: string): string {
  return `/podcast/${slug}`
}

/** Absolute URL for the current host (works on platform.* and evolvedpros.com). */
export function episodeShareUrl(slug: string): string {
  if (typeof window === 'undefined') return episodeSharePath(slug)
  return `${window.location.origin}${episodeSharePath(slug)}`
}

export function readSavedEpisodeIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(SAVED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function isEpisodeSaved(episodeId: string): boolean {
  return readSavedEpisodeIds().includes(episodeId)
}

export function toggleSavedEpisode(episodeId: string): boolean {
  const ids = readSavedEpisodeIds()
  const next = ids.includes(episodeId)
    ? ids.filter(id => id !== episodeId)
    : [...ids, episodeId]
  window.localStorage.setItem(SAVED_KEY, JSON.stringify(next))
  return next.includes(episodeId)
}

export function shareUrls(shareUrl: string, title: string) {
  const u = encodeURIComponent(shareUrl)
  const t = encodeURIComponent(title)
  return {
    x: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
  } as const
}

export async function nativeShareOrCopy(shareUrl: string, title: string): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: title, url: shareUrl })
      return 'shared'
    } catch (err) {
      // User cancelled — not a failure worth surfacing.
      if (err instanceof DOMException && err.name === 'AbortError') return 'failed'
    }
  }
  try {
    await navigator.clipboard.writeText(shareUrl)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export function openShareWindow(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
