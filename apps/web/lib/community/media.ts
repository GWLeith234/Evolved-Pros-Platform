/**
 * Community media (SPRINT CM-1) — shared rules for attaching an asset to a
 * post or a comment.
 *
 * Deliberately dependency-free and free of `server-only` so the exact same
 * validation runs in three places:
 *   1. the composer, to disable the Post button and show a message early;
 *   2. the API route, which is the authority — the client check is a courtesy;
 *   3. vitest, with no DOM and no network.
 *
 * CM-1 ships IMAGE only. The video constants exist because the bucket and the
 * 079 CHECK constraint already accept video for CM-2; nothing in CM-1 writes
 * a video row.
 */

export const COMMUNITY_MEDIA_BUCKET = 'community-media'

export type MediaKind = 'image' | 'video'

/** Accepted on an image attach in CM-1. */
export const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

/** CM-2. Listed on the bucket already so CM-2 needs no bucket change. */
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'] as const

/** Bucket-level allowlist — the ceiling, not the CM-1 rule. */
export const BUCKET_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES] as const

/** Bucket-level ceiling (100 MB), sized for CM-2 video. */
export const BUCKET_MAX_BYTES = 104857600

/** The CM-1 image rule, enforced in the API route independently of the bucket. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

/** `accept` attribute for the composer's file input. */
export const IMAGE_ACCEPT_ATTR = IMAGE_MIME_TYPES.join(',')

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}

export type MediaValidationOk = {
  ok: true
  kind: MediaKind
  mime: string
  ext: string
}

export type MediaValidationError = {
  ok: false
  /** HTTP status the API route should answer with. */
  status: 413 | 415 | 422
  /** Human-readable. Surfaced verbatim to the member — never swallowed. */
  error: string
}

export type MediaValidation = MediaValidationOk | MediaValidationError

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * The one gate every image attach passes through.
 *
 * Order matters: an empty file is reported as empty, an unsupported type is
 * reported as a type problem even when it is also oversize (telling somebody
 * their .mov is "too big" sends them off to compress a file we would reject
 * either way).
 */
export function validateImageUpload(file: { type?: string | null; size?: number | null }): MediaValidation {
  const mime = (file.type ?? '').toLowerCase().split(';')[0].trim()
  const size = file.size ?? 0

  if (!mime) {
    return {
      ok: false,
      status: 415,
      error: "We couldn't tell what kind of file that is. Attach a PNG, JPEG, or WebP image.",
    }
  }

  if (!(IMAGE_MIME_TYPES as readonly string[]).includes(mime)) {
    return {
      ok: false,
      status: 415,
      error: `${mime} isn't supported. Attach a PNG, JPEG, or WebP image.`,
    }
  }

  if (size <= 0) {
    return { ok: false, status: 422, error: 'That file is empty.' }
  }

  if (size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `That image is ${formatBytes(size)}. Images must be ${formatBytes(MAX_IMAGE_BYTES)} or smaller.`,
    }
  }

  return { ok: true, kind: 'image', mime, ext: EXT_BY_MIME[mime] }
}

/**
 * Storage key for a new upload: community-media/{auth.uid()}/{uuid}.{ext}.
 *
 * The auth.uid() prefix is what the storage.objects INSERT policy checks, so
 * this must stay in lockstep with supabase/storage/community-media-bucket.sql.
 * A fresh uuid per upload means nothing is ever overwritten.
 */
export function buildMediaPath(authUid: string, uuid: string, ext: string): string {
  return `${authUid}/${uuid}.${ext}`
}

export type PostMedia = {
  kind: MediaKind
  url: string
  width: number | null
  height: number | null
}

type MediaColumns = {
  media_url?: string | null
  media_kind?: string | null
  media_width?: number | null
  media_height?: number | null
}

/**
 * Row → API/UI shape. Returns null for every text-only row, which is every row
 * that predates 079 — the feed keeps rendering them untouched.
 */
export function toPostMedia(row: MediaColumns | null | undefined): PostMedia | null {
  if (!row) return null
  const url = row.media_url ?? null
  const kind = row.media_kind ?? null
  if (!url || (kind !== 'image' && kind !== 'video')) return null
  return {
    kind,
    url,
    width: typeof row.media_width === 'number' ? row.media_width : null,
    height: typeof row.media_height === 'number' ? row.media_height : null,
  }
}

/** Canonical in-app path for a single post. */
export function buildPermalink(postId: string): string {
  return `/community/${postId}`
}

export type PermalinkPayload = {
  id: string
  permalink: string
  author: { id: string; displayName: string; avatarUrl: string | null; tier: string | null }
  body: string
  media: PostMedia | null
  created_at: string
}

/** The exact shape GET /api/community/posts/:id answers with. */
export function toPermalinkPayload(row: {
  id: string
  body: string
  created_at: string
  users?: {
    id: string
    display_name?: string | null
    full_name?: string | null
    avatar_url?: string | null
    tier?: string | null
  } | null
} & MediaColumns): PermalinkPayload {
  const author = row.users ?? null
  return {
    id: row.id,
    permalink: buildPermalink(row.id),
    author: {
      id: author?.id ?? '',
      displayName: author?.full_name ?? author?.display_name ?? 'Member',
      avatarUrl: author?.avatar_url ?? null,
      tier: author?.tier ?? null,
    },
    body: row.body,
    media: toPostMedia(row),
    created_at: row.created_at,
  }
}

/** Columns every community read needs so media survives the round trip. */
export const MEDIA_SELECT_COLUMNS = 'media_url, media_kind, media_width, media_height'
