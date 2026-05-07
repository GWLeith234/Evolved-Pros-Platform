export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

// PATCH /api/profile/avatar
// Body: { url: string } — already-uploaded image URL (e.g. from /api/user/avatar
// or /api/admin/images/upload). Persists it onto public.users.avatar_url.
// One-shot endpoint so the ImagePicker can update the avatar without the
// caller also having to know about the broader /api/user/me PATCH surface.
export async function PATCH(request: Request) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { url?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Content-Type must be application/json' },
      { status: 415 },
    )
  }

  const url = typeof body.url === 'string' ? body.url.trim() : ''
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 422 })
  if (url.length > 2048) return NextResponse.json({ error: 'url too long' }, { status: 422 })
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: 'url must be http(s)' }, { status: 422 })
  }

  const { error } = await adminClient
    .from('users')
    .update({ avatar_url: url })
    .eq('id', profile.id)

  if (error) {
    console.error('[profile/avatar] update failed:', error.message)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ avatar_url: url })
}
