import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // UPSERT (was UPDATE): an UPDATE against a non-existent row writes zero rows
  // yet returns success, stranding accounts that have no public.users row.
  // Conflict target is `email` — this app keys public.users by email, not by
  // auth.uid() (public.users.id is an independent uuid with its own default).
  // Onboarding owns ONLY these columns; tier / tier_status / tier_expires_at /
  // stripe_customer_id / stripe_subscription_id are billing-owned and must
  // never be written here, so an insert cannot clobber them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('users')
    .upsert(
      { email: user.email, onboarding_completed: true, onboarding_step: 5 },
      { onConflict: 'email' },
    )
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    // Returning clause reported zero rows — nothing was actually written.
    console.error('[onboarding/complete] wrote zero rows for email=', user.email)
    return NextResponse.json({ error: 'No user record was written' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
