export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { logProviderError } from '@/lib/http/clientError'
import { readProfileImageUrl } from '@/lib/onboarding/profilePatch'

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

  const read = readProfileImageUrl(body.url)
  if (!read.ok) return NextResponse.json({ error: read.error }, { status: 422 })
  const url = read.url

  const { error } = await adminClient
    .from('users')
    .update({ avatar_url: url })
    .eq('id', profile.id)

  if (error) {
    logProviderError('[profile/avatar] update failed', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ avatar_url: url })
}
