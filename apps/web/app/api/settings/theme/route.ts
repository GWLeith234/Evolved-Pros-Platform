export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { NextResponse } from 'next/server'
import { isThemePreference, toThemePreference, type ThemePreference } from '@/lib/theme'

/**
 * The signed-in member's theme preference — the source of truth for which
 * theme loads on any device.
 *
 * Keyed on resolveCurrentUser()'s public.users.id (adminClient), not
 * auth.uid(). A non-trivial number of accounts have auth.uid() ≠
 * public.users.id; the previous `.eq('id', user.id)` under users_update_own
 * returned 404 for those members and the preference never persisted.
 */

export async function GET() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({ theme: toThemePreference(profile.theme) })
}

export async function PATCH(req: Request) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { theme?: unknown }
  try {
    body = await req.json() as { theme?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!isThemePreference(body.theme)) {
    return NextResponse.json({ error: 'theme must be light, dark, or system' }, { status: 422 })
  }
  const theme: ThemePreference = body.theme

  // .select() back so a policy-blocked or missing row surfaces as an error
  // instead of a silent 200 — the failure mode that let this preference look
  // persisted while nothing was ever written.
  const { data, error } = await adminClient
    .from('users')
    .update({ theme, updated_at: new Date().toISOString() })
    .eq('id', profile.id)
    .select('theme')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: 'Theme not saved — no profile row matched this account.' },
      { status: 404 },
    )
  }

  return NextResponse.json({ ok: true, theme: data[0].theme })
}
