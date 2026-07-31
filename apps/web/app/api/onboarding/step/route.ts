import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { step?: number }
  const step = body.step
  if (typeof step !== 'number' || step < 1 || step > 5) {
    return NextResponse.json({ error: 'step must be 1–5' }, { status: 422 })
  }

  // UPSERT (was UPDATE): same stranded-row defect as /complete — an UPDATE on a
  // missing public.users row writes nothing but returns success. Conflict on
  // `email`. We also set id = user.id (auth.uid()) so an INSERTed row satisfies
  // the RLS policies that key on auth.uid() = id (public.users.id = auth.uid(),
  // NOT an independent uuid); without it the insert would fall back to
  // uuid_generate_v4() and strand the row behind its own RLS. On the UPDATE
  // path it is a no-op — the conflicting row is this user's own, whose id
  // already equals user.id. Onboarding owns only onboarding_step here; no
  // tier/billing columns are ever touched.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('users')
    .upsert({ id: user.id, email: user.email, onboarding_step: step }, { onConflict: 'email' })
    .select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    console.error('[onboarding/step] wrote zero rows for email=', user.email)
    return NextResponse.json({ error: 'No user record was written' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
