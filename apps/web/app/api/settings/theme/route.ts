export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isThemePreference, toThemePreference, type ThemePreference } from '@/lib/theme'

/**
 * The signed-in member's theme preference — the source of truth for which
 * theme loads on any device.
 *
 * Runs under the caller's own grant (anon key + session cookies), so the
 * `users_update_own` / `users_select_own` policies (USING auth.uid() = id) are
 * what authorise the write. No service-role client: a member updating their own
 * row is exactly what RLS already permits, and routing it through the admin
 * client would mean a bug in the id filter could write someone else's row.
 */

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('users')
    .select('theme')
    .eq('id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json({ theme: toThemePreference(data.theme) })
}

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  const { data, error } = await supabase
    .from('users')
    .update({ theme, updated_at: new Date().toISOString() })
    .eq('id', user.id)
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
