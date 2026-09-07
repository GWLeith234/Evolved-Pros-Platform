/**
 * Public episode stills must load under the platform CSP img-src allow-list.
 * Transistor's CloudFront host is not allowed. Prefer the guest still, then a
 * known rehosted asset, then an allowed thumbnail, then YouTube.
 */

export const JUAN_EP010_STILL = '/podcast/guests/juan-fernandez.jpg'
export const JUAN_EP010_SLUG = 'evolved-pros-podcast-ep-010-juan-fernandez'
export const QUANG_DO_STILL =
  'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/episodes/guest-mentorship-generational-gap-quang-do.jpg'
export const QUANG_DO_SLUG = 'mentorship-generational-gap-quang-do'
export const TRANSISTOR_CDN_HOST = 'd3t3ozftmdmh3i.cloudfront.net'
/** Square headshots in 16:9 cards. Pin the face, not the torso. */
export const GUEST_FACE_OBJECT_POSITION = 'center top' as const
export const DEFAULT_STILL_OBJECT_POSITION = 'center' as const

export type EpisodeStillSource = {
  guest_image_url?: string | null
  thumbnail_url?: string | null
  youtube_id?: string | null
  slug?: string | null
  episode_number?: number | null
  guest_name?: string | null
}

export function isBlockedStillHost(url: string): boolean {
  try {
    const host = new URL(url, 'https://www.evolvedpros.com').hostname.toLowerCase()
    return host === TRANSISTOR_CDN_HOST || host.endsWith('.cloudfront.net')
  } catch {
    return false
  }
}

export function isJuanEp010(ep: EpisodeStillSource): boolean {
  if (ep.slug === JUAN_EP010_SLUG) return true
  const guest = (ep.guest_name ?? '').toLowerCase()
  if (ep.episode_number === 10 && guest.includes('juan')) return true
  return false
}

export function isQuangDo(ep: EpisodeStillSource): boolean {
  const slug = (ep.slug ?? '').toLowerCase()
  if (slug === QUANG_DO_SLUG || slug.includes('quang-do')) return true
  const guest = (ep.guest_name ?? '').toLowerCase()
  return guest.includes('quang')
}

function stillLooksLikeJuan(url?: string | null): boolean {
  return Boolean(url && (url === JUAN_EP010_STILL || url.includes('juan-fernandez.jpg')))
}

function stillLooksLikeQuang(url?: string | null): boolean {
  return Boolean(url && (url === QUANG_DO_STILL || url.includes('guest-mentorship-generational-gap-quang-do')))
}

/** Conversion `/` aspect-video cards. Juan and Quang are square headshots. */
export function homeGuestStillObjectPosition(ep: {
  stillUrl?: string | null
  slug?: string | null
  guestName?: string | null
  episodeNumber?: number | null
}): string {
  const source: EpisodeStillSource = {
    slug: ep.slug,
    guest_name: ep.guestName,
    episode_number: ep.episodeNumber,
  }
  if (isJuanEp010(source) || stillLooksLikeJuan(ep.stillUrl)) {
    return GUEST_FACE_OBJECT_POSITION
  }
  if (isQuangDo(source) || stillLooksLikeQuang(ep.stillUrl)) {
    return GUEST_FACE_OBJECT_POSITION
  }
  return DEFAULT_STILL_OBJECT_POSITION
}

function firstAllowed(url?: string | null): string | null {
  const value = url?.trim()
  if (!value) return null
  if (isBlockedStillHost(value)) return null
  return value
}

function youtubeStill(youtubeId?: string | null): string | null {
  const id = youtubeId?.trim()
  if (!id) return null
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

/** Guest still first. Never emit a CloudFront URL. Juan EP010 uses the local still. */
export function allowedEpisodeStillUrl(ep: EpisodeStillSource): string | null {
  const guest = firstAllowed(ep.guest_image_url)
  if (guest) return guest
  if (isJuanEp010(ep)) return JUAN_EP010_STILL
  const thumb = firstAllowed(ep.thumbnail_url)
  if (thumb) return thumb
  return youtubeStill(ep.youtube_id)
}
