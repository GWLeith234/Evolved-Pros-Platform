import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const ALLOWED_THEMES = ['light', 'dark', 'system']

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { theme?: string }
  if (!body.theme || !ALLOWED_THEMES.includes(body.theme)) {
    return NextResponse.json({ error: 'theme must be light, dark, or system' }, { status: 422 })
  }

  // Use adminClient + email lookup to handle auth UUID ≠ public users UUID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('users')
    .update({ theme: body.theme })
    .eq('email', user.email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
