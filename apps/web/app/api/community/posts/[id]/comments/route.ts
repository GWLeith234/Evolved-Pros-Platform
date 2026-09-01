export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { toPostMedia } from '@/lib/community/media'
import { readOptionalFile, uploadCommunityImage } from '@/lib/community/uploadMedia.server'
import { notifyReply } from '@/lib/notifications/create'

/**
 * POST /api/community/posts/:id/comments — reply to a post, optionally with
 * one attached image (SPRINT CM-1).
 *
 * multipart/form-data:
 *   body  text   required unless a file is attached
 *   file  image  optional, one max
 *
 * Author is ALWAYS the signed-in member resolved from the session.
 * Reads still go through GET /api/posts/:postId/replies.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'You need to be signed in to reply.' }, { status: 401 })

  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'We could not find your member profile.' }, { status: 401 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'That reply could not be read. Try again.' }, { status: 400 })
  }

  const body = String(form.get('body') ?? '').trim()
  const file = readOptionalFile(form)

  if (!body && !file) {
    return NextResponse.json({ error: 'Write something or attach an image.' }, { status: 422 })
  }
  if (body.length > 2000) {
    return NextResponse.json({ error: 'Reply exceeds 2000 characters.' }, { status: 422 })
  }

  const { data: post } = await adminClient
    .from('posts')
    .select('author_id, reply_count, channels(slug)')
    .eq('id', params.id)
    .maybeSingle()

  if (!post) return NextResponse.json({ error: 'That post no longer exists.' }, { status: 404 })

  /* Upload before insert so a rejected image never leaves an orphan comment. */
  let media = {}
  if (file) {
    const uploaded = await uploadCommunityImage(file, user.id)
    if (!uploaded.ok) {
      return NextResponse.json({ error: uploaded.error }, { status: uploaded.status })
    }
    media = uploaded.media
  }

  const { data: reply, error } = await adminClient
    .from('replies')
    .insert({ post_id: params.id, author_id: profile.id, body, ...media } as never)
    .select('id, post_id, body, created_at, media_url, media_kind, media_width, media_height, users(id, display_name, full_name, avatar_url)')
    .single()

  if (error || !reply) {
    console.error('[community/comments] insert failed:', error?.message)
    return NextResponse.json({ error: "We couldn't post that reply. Try again." }, { status: 500 })
  }

  await adminClient
    .from('posts')
    .update({ reply_count: (post.reply_count ?? 0) + 1 })
    .eq('id', params.id)

  /* Points are a nice-to-have — never let them fail the reply. */
  try {
    await adminClient
      .from('users')
      .update({ points: (profile.points ?? 0) + 5 })
      .eq('id', profile.id)
  } catch (err) {
    console.warn('[community/comments] points update failed:', err)
  }

  {
    const replierName = profile.display_name ?? profile.full_name ?? 'Someone'
    const channelSlug = (post.channels as { slug: string } | null)?.slug ?? 'general'
    void notifyReply({
      postAuthorId:    post.author_id,
      replyAuthorId:   profile.id,
      replyAuthorName: replierName,
      channelSlug,
      postId:          params.id,
      replySnippet:    body || 'shared an image',
    })
  }

  const row = reply as {
    id: string; post_id: string; body: string; created_at: string
    media_url: string | null; media_kind: string | null
    media_width: number | null; media_height: number | null
    users: { id: string; display_name: string | null; full_name: string | null; avatar_url: string | null } | null
  }

  return NextResponse.json(
    {
      id: row.id,
      postId: row.post_id,
      body: row.body,
      createdAt: row.created_at,
      media: toPostMedia(row),
      author: {
        id: row.users?.id ?? '',
        displayName: row.users?.full_name ?? row.users?.display_name ?? 'Member',
        avatarUrl: row.users?.avatar_url ?? null,
      },
    },
    { status: 201 },
  )
}
