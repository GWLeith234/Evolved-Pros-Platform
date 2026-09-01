export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { toPermalinkPayload } from '@/lib/community/media'

/**
 * GET /api/community/posts/:id — single post, permalink shape (SPRINT CM-1).
 *
 *   { id, permalink, author, body, media: { kind, url, width, height }, created_at }
 *
 * media is null for every text-only post, which is every post that predates
 * migration 079.
 *
 * Members only, matching the posts SELECT policy (auth.uid() IS NOT NULL) —
 * the feed is not public even though the media bucket is.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'You need to be signed in.' }, { status: 401 })

  const { data, error } = await adminClient
    .from('posts')
    .select('id, body, created_at, media_url, media_kind, media_width, media_height, users!posts_author_id_fkey(id, display_name, full_name, avatar_url, tier)')
    .eq('id', params.id)
    .maybeSingle()

  if (error) {
    console.error('[community/posts/:id] select failed:', error.message)
    return NextResponse.json({ error: "We couldn't load that post." }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'That post no longer exists.' }, { status: 404 })

  return NextResponse.json(toPermalinkPayload(data as Parameters<typeof toPermalinkPayload>[0]))
}
