export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { logProviderError } from '@/lib/http/clientError'
import { readJsonObject, readProfileImageUrl } from '@/lib/onboarding/profilePatch'

/**
 * PATCH /api/profile/banner
 * Body: { url: string } — persist onto public.users.banner_url.
 *
 * Goes through resolveCurrentUser + adminClient so accounts where
 * auth.uid() ≠ public.users.id still write their own row. The previous
 * client-side `.eq('email', …)` update died on `users_update_own`
 * (`auth.uid() = id`) for those accounts.
 */
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
    .update({ banner_url: url })
    .eq('id', profile.id)

  if (error) {
    logProviderError('[profile/banner] update failed', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ banner_url: url })
}
