export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'

// POST /api/admin/friends/revoke — revoke a Friends of George invite.
// Body: { id: string } (friend_invites.id). Marks the invite 'revoked'; if it
// had already been redeemed, strips the member's comp Pro access (tier back to
// community, tier_status cleared, comp flag cleared).
export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: { id?: unknown }
  try {
    body = (await request.json()) as { id?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'Missing invite id.' }, { status: 422 })

  const { data: invite } = await (adminClient as any)
    .from('friend_invites')
    .select('id, email, status')
    .eq('id', id)
    .maybeSingle()
  if (!invite) return NextResponse.json({ error: 'Invite not found.' }, { status: 404 })

  const { error: revErr } = await (adminClient as any)
    .from('friend_invites')
    .update({ status: 'revoked' })
    .eq('id', id)
  if (revErr) return NextResponse.json({ error: 'Could not revoke invite.' }, { status: 500 })

  // If already redeemed, pull the comp Pro access.
  let accessRevoked = false
  if (invite.status === 'redeemed') {
    const { error: userErr } = await adminClient
      .from('users')
      .update({ tier: 'community', tier_status: null, comp_promo_code_id: null })
      .eq('email', invite.email)
    if (userErr) {
      return NextResponse.json(
        { error: 'Invite revoked, but failed to remove Pro access.' },
        { status: 500 },
      )
    }
    accessRevoked = true
  }

  return NextResponse.json({ ok: true, accessRevoked })
}
