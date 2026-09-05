import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { supabaseIntakeDb } from '@/lib/crm/intakeDb'
import {
  displayNameFromEmail,
  notifyJoinAdmins,
  shouldNotifyJoinBackstop,
  upsertJoinProspect,
} from '@/lib/crm/join'

export async function PATCH() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // UPSERT (was UPDATE): an UPDATE against a non-existent row writes zero rows
  // yet returns success, stranding accounts that have no public.users row.
  // Conflict target is `email` (public.users has a unique email).
  //
  // We MUST also set id = user.id (the auth uuid from auth.getUser(), i.e.
  // auth.uid()). public.users.id is NOT independent of auth: every row has
  // public.users.id = auth.users.id, and the RLS policies on public.users
  // (users_select_own, users_update_own, "Users can insert own profile") all
  // key on auth.uid() = id. On the INSERT path — the stranded-user case this
  // handler exists for — omitting id would let it default to
  // uuid_generate_v4(), producing a row whose id != auth.uid() that then fails
  // its own RLS policies forever. On the UPDATE path this is a no-op: the
  // conflicting row is this same user's own row, whose id already equals
  // user.id, so `SET id = EXCLUDED.id` writes the same value and never changes
  // an existing row's id.
  //
  // Onboarding owns ONLY these columns; tier / tier_status / tier_expires_at /
  // stripe_customer_id / stripe_subscription_id are billing-owned and must
  // never be written here, so an insert cannot clobber them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('users')
    .upsert(
      { id: user.id, email: user.email, onboarding_completed: true, onboarding_step: 5 },
      { onConflict: 'email' },
    )
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    // Returning clause reported zero rows — nothing was actually written.
    console.error('[onboarding/complete] wrote zero rows for email=', user.email)
    return NextResponse.json({ error: 'No user record was written' }, { status: 404 })
  }

  // Backstop for join CRM when the client provision hook was skipped.
  try {
    const { data: profile } = await adminClient
      .from('users')
      .select('id, email, full_name, first_name, last_name')
      .eq('id', user.id)
      .maybeSingle()
    const fullName =
      (profile as { full_name?: string | null } | null)?.full_name?.trim() ||
      [
        (profile as { first_name?: string | null } | null)?.first_name,
        (profile as { last_name?: string | null } | null)?.last_name,
      ]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      displayNameFromEmail(user.email)
    const joinWrite = { email: user.email.toLowerCase(), full_name: fullName, user_id: user.id }
    const crm = await upsertJoinProspect(supabaseIntakeDb, joinWrite)
    if (crm.kind === 'error') {
      console.error('[onboarding/complete] join crm failed', crm.code ?? 'unknown')
    } else if (shouldNotifyJoinBackstop(crm)) {
      const notified = await notifyJoinAdmins(supabaseIntakeDb, joinWrite)
      if (notified.code) {
        console.error('[onboarding/complete] join notify failed', notified.code)
      }
    }
  } catch {
    console.error('[onboarding/complete] join crm threw')
  }

  return NextResponse.json({ ok: true })
}
