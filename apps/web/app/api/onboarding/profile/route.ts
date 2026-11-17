import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { clientSafeError } from '@/lib/http/clientError'
import { profilePatchUpdate } from '@/lib/onboarding/profilePatch'

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = profilePatchUpdate(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  if (Object.keys(parsed.update).length === 0) {
    return NextResponse.json({ ok: true })
  }

  // Service role bypasses RLS. The filter is the session user id.
  // An id on the body is not allowlisted and is never the filter.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('users')
    .update(parsed.update)
    .eq('id', user.id)

  if (error) {
    return NextResponse.json(
      { error: clientSafeError('[PATCH /api/onboarding/profile]', error, 'Could not save your profile.') },
      { status: 500 },
    )
  }
  return NextResponse.json({ ok: true })
}
