import 'server-only'
import sharp from 'sharp'
import { adminClient } from '@/lib/supabase/admin'
import {
  COMMUNITY_MEDIA_BUCKET,
  buildMediaPath,
  validateImageUpload,
  type MediaValidationError,
} from './media'

/**
 * Server side of an image attach: validate, read intrinsic dimensions, upload
 * to the community-media bucket, hand back the columns 079 added.
 *
 * The client runs the same validateImageUpload() before it ever posts, but
 * this is the authority — a caller that skips the UI still gets rejected here.
 */

export type UploadedMedia = {
  media_url: string
  media_kind: 'image'
  media_width: number | null
  media_height: number | null
}

export type UploadMediaResult =
  | { ok: true; media: UploadedMedia }
  | { ok: false; status: number; error: string }

/**
 * @param authUid  auth.uid() of the signed-in caller. This is the path prefix
 *                 the storage.objects INSERT policy checks, so it must be the
 *                 auth id — NOT public.users.id, which drifts from it on
 *                 legacy accounts (see lib/auth/resolveCurrentUser).
 */
export async function uploadCommunityImage(
  file: Blob,
  authUid: string,
): Promise<UploadMediaResult> {
  const check = validateImageUpload({ type: file.type, size: file.size })
  if (!check.ok) {
    const err = check as MediaValidationError
    return { ok: false, status: err.status, error: err.error }
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  /* Intrinsic dimensions are persisted so the feed can reserve the exact box
     before the bytes arrive — no layout shift as images stream in. A metadata
     failure is not fatal: the row still renders, just without a reserved box. */
  let width: number | null = null
  let height: number | null = null
  try {
    const meta = await sharp(buffer).metadata()
    /* EXIF orientation 5-8 swaps the axes; sharp reports pre-rotation values,
       so an upright phone photo would otherwise be described sideways. */
    const swap = typeof meta.orientation === 'number' && meta.orientation >= 5
    const w = meta.width ?? null
    const h = meta.height ?? null
    width = swap ? h : w
    height = swap ? w : h
  } catch (err) {
    console.warn('[community/media] could not read dimensions:', err)
  }

  const path = buildMediaPath(authUid, crypto.randomUUID(), check.ext)

  /* upsert:false — a fresh uuid per upload means we never overwrite, and a
     collision should surface as an error rather than silently clobber. */
  const { error: uploadError } = await adminClient.storage
    .from(COMMUNITY_MEDIA_BUCKET)
    .upload(path, buffer, { contentType: check.mime, upsert: false })

  if (uploadError) {
    console.error('[community/media] upload failed:', uploadError.message)
    const missingBucket = /bucket not found/i.test(uploadError.message)
    return {
      ok: false,
      status: missingBucket ? 503 : 500,
      error: missingBucket
        ? 'Image uploads are not switched on yet. Post it as text for now.'
        : "We couldn't upload that image. Try again in a moment.",
    }
  }

  const { data: { publicUrl } } = adminClient.storage
    .from(COMMUNITY_MEDIA_BUCKET)
    .getPublicUrl(path)

  return {
    ok: true,
    media: { media_url: publicUrl, media_kind: 'image', media_width: width, media_height: height },
  }
}

/**
 * Pulls the optional `file` part out of a multipart body.
 * Returns null for text-only submits — the browser sends an empty File part
 * for an untouched <input type=file>, which must read as "no attachment".
 */
export function readOptionalFile(form: FormData): Blob | null {
  const entry = form.get('file')
  if (!entry || typeof entry === 'string') return null
  const blob = entry as Blob
  if (blob.size === 0) return null
  return blob
}
