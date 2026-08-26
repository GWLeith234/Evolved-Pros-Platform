/* Node runtime: sharp (dimension probe) and Buffer are not edge-safe. */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { buildPermalink, toPostMedia } from '@/lib/community/media'
import { readOptionalFile, uploadCommunityImage } from '@/lib/community/uploadMedia.server'

/**
 * POST /api/community/posts — create a community post, optionally with one
 * attached image (SPRINT CM-1).
 *
 * multipart/form-data:
 *   body      text            required
 *   type      update|win|question
 *   file      image           optional, one max
 *   channelId uuid            required
 *   pillar    1-6             optional
 *
 * Author is ALWAYS the signed-in member resolved from the session. There is no
 * author field on the wire and no service identity — a caller cannot post as
 * anyone but themselves.
 *
 * Polls stay on POST /api/posts (JSON): they need poll_options rows, and CM-1
 * scopes this route to update|win|question per the sprint card.
 */

const VALID_TYPES = ['update', 'win', 'question'] as const
type PostKind = (typeof VALID_TYPES)[number]

export async function POST(request: Request) {
  const supabase = createClient()

  /* Two ids, deliberately: auth.uid() owns the storage path (that is what the
     storage.objects policy checks), public.users.id owns the FK. They drift on
     legacy accounts — see lib/auth/resolveCurrentUser. */
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'You need to be signed in to post.' }, { status: 401 })

  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'We could not find your member profile.' }, { status: 401 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'That post could not be read. Try again.' }, { status: 400 })
  }

  const body = String(form.get('body') ?? '').trim()
  const channelId = String(form.get('channelId') ?? '').trim()
  const rawType = String(form.get('type') ?? 'update').trim()
  const rawPillar = String(form.get('pillar') ?? '').trim()

  if (!channelId) return NextResponse.json({ error: 'channelId is required.' }, { status: 422 })

  const file = readOptionalFile(form)

  /* An image on its own is still a post — but there has to be something. */
  if (!body && !file) {
    return NextResponse.json({ error: 'Write something or attach an image.' }, { status: 422 })
  }
  if (body.length > 5000) {
    return NextResponse.json({ error: 'Post exceeds 5000 characters.' }, { status: 422 })
  }

  if (!(VALID_TYPES as readonly string[]).includes(rawType)) {
    return NextResponse.json({ error: 'Invalid post type.' }, { status: 400 })
  }
  const kind = rawType as PostKind

  let pillar: number | null = null
  if (rawPillar) {
    const n = Number(rawPillar)
    if (!Number.isInteger(n) || n < 1 || n > 6) {
      return NextResponse.json({ error: 'Invalid pillar.' }, { status: 400 })
    }
    pillar = n
  }

  /* Validate + upload BEFORE the insert so a rejected image never leaves a
     half-formed post in the feed. */
  let media = {}
  if (file) {
    const uploaded = await uploadCommunityImage(file, user.id)
    if (!uploaded.ok) {
      return NextResponse.json({ error: uploaded.error }, { status: uploaded.status })
    }
    media = uploaded.media
  }

  const { data: post, error } = await adminClient
    .from('posts')
    .insert({
      author_id: profile.id,
      channel_id: channelId,
      body,
      /* Legacy columns kept in sync so the existing fetchers keep working. */
      pillar_tag: pillar ? (`p${pillar}` as 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6') : null,
      post_type: kind,
      kind,
      pillar,
      ...media,
    } as never)
    .select('id, body, created_at, media_url, media_kind, media_width, media_height')
    .single()

  if (error || !post) {
    console.error('[community/posts] insert failed:', error?.message)
    return NextResponse.json({ error: "We couldn't publish that post. Try again." }, { status: 500 })
  }

  /* Points are a nice-to-have — never let them fail the post. */
  try {
    const { error: rpcErr } = await adminClient.rpc('increment_points', { user_id: profile.id, amount: 10 })
    if (rpcErr) console.warn('[community/posts] increment_points failed:', rpcErr.message)
  } catch (err) {
    console.warn('[community/posts] increment_points exception:', err)
  }

  const row = post as {
    id: string; body: string; created_at: string
    media_url: string | null; media_kind: string | null
    media_width: number | null; media_height: number | null
  }

  return NextResponse.json(
    {
      id: row.id,
      permalink: buildPermalink(row.id),
      body: row.body,
      media: toPostMedia(row),
      created_at: row.created_at,
    },
    { status: 201 },
  )
}
