export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { logProviderError } from '@/lib/http/clientError'
import { readJsonObject, readProfileImageUrl } from '@/lib/onboarding/profilePatch'

// PATCH /api/profile/avatar
// Body: { url: string } — already-uploaded image URL (e.g. from /api/user/avatar
// or /api/admin/images/upload). Persists it onto public.users.avatar_url.
// One-shot endpoint so the ImagePicker can update the avatar without the
// caller also having to know about the broader /api/user/me PATCH surface.
export async function PATCH(request: Request) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = await readJsonObject(request)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const read = readProfileImageUrl(parsed.body.url)
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
