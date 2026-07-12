import { adminClient } from '@/lib/supabase/admin'
import { mux } from '@/lib/mux/client'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { asTranscriptSegments } from '@/lib/academy/transcript'
import { asKeyTakeaways } from '@/lib/academy/takeaways'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: { lessonId: string } },
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const body = await req.json() as Record<string, unknown>

  // If muxUploadId provided, resolve asset ID from Mux then persist it
  if (body.muxUploadId && typeof body.muxUploadId === 'string') {
    try {
      const upload = await mux.video.uploads.retrieve(body.muxUploadId)
      if (upload.asset_id) {
        body.mux_asset_id = upload.asset_id
      }
    } catch (err) {
      console.error('[Mux] Failed to retrieve upload:', err)
    }
    delete body.muxUploadId
  }

  // transcript: null clears it; otherwise must be a valid segments array.
  if ('transcript' in body && body.transcript !== null) {
    const segments = asTranscriptSegments(body.transcript)
    if (!segments) {
      return NextResponse.json(
        { error: 'transcript must be null or an array of { timestamp, seconds, text } segments' },
        { status: 422 },
      )
    }
    body.transcript = segments
  }

  // key_takeaways: null clears it; otherwise a non-empty array of strings.
  if ('key_takeaways' in body && body.key_takeaways !== null) {
    const takeaways = asKeyTakeaways(body.key_takeaways)
    if (!takeaways) {
      return NextResponse.json(
        { error: 'key_takeaways must be null or an array of 1-8 non-empty strings (≤300 chars each)' },
        { status: 422 },
      )
    }
    body.key_takeaways = takeaways
  }

  // discussion_prompt: plain text; null clears, blank coerced to null.
  if ('discussion_prompt' in body && body.discussion_prompt !== null) {
    if (typeof body.discussion_prompt !== 'string' || body.discussion_prompt.length > 500) {
      return NextResponse.json(
        { error: 'discussion_prompt must be null or a string of ≤500 chars' },
        { status: 422 },
      )
    }
    body.discussion_prompt = body.discussion_prompt.trim() || null
  }

  // content_blocks: written lesson content (merged in from the academy
  // Content Builder). Must be an array when present.
  if ('content_blocks' in body && !Array.isArray(body.content_blocks)) {
    return NextResponse.json(
      { error: 'content_blocks must be an array' },
      { status: 422 },
    )
  }

  const allowed = ['title', 'slug', 'description', 'sort_order', 'duration_seconds', 'is_published', 'mux_asset_id', 'mux_playback_id', 'transcript', 'key_takeaways', 'discussion_prompt', 'content_blocks'] as const
  type AllowedKey = typeof allowed[number]
  const update = Object.fromEntries(
    allowed
      .filter(k => k in body)
      .map(k => [k, body[k as AllowedKey]])
  )

  // RLS-FIX: adminClient — see lessons/route.ts.
  const { data, error } = await adminClient
    .from('lessons')
    .update(update)
    .eq('id', params.lessonId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { lessonId: string } },
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { error } = await adminClient
    .from('lessons')
    .delete()
    .eq('id', params.lessonId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
