/**
 * Member writes on the public Branding bucket must land in
 * avatars/<auth uid>/<ms>.<ext> or banners/<auth uid>/<ms>.<ext>.
 * The id is auth.uid(), not public.users.id.
 */

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
} as const

export type MemberImageMime = keyof typeof EXT_BY_MIME

const AUTH_UID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function memberImageMime(type: string | null | undefined): MemberImageMime | null {
  const mime = (type ?? '').toLowerCase().split(';')[0].trim()
  if (mime in EXT_BY_MIME) return mime as MemberImageMime
  return null
}

export function memberOwnedBrandingPath(
  area: 'avatars' | 'banners',
  authUserId: string,
  nowMs: number,
  mime: string | null | undefined,
): { path: string; contentType: MemberImageMime } | null {
  const id = authUserId.trim()
  if (!AUTH_UID.test(id)) return null
  const contentType = memberImageMime(mime)
  if (!contentType) return null
  if (!Number.isInteger(nowMs) || nowMs < 0) return null
  return {
    path: `${area}/${id}/${nowMs}.${EXT_BY_MIME[contentType]}`,
    contentType,
  }
}
