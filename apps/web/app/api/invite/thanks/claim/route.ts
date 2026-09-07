export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import {
  bestEffortConversion,
  notifyThanksAdmins,
  upsertThanksProspect,
} from '@/lib/crm/conversion'
import { supabaseIntakeDb } from '@/lib/crm/intakeDb'
import { THANKS_GRANTS_TIER, THANKS_PROMO_CODE, THANKS_TIER_STATUS } from '@/lib/thanks/constants'
import { decideThanksGrant, type MemberSnapshot } from '@/lib/thanks/eligibility'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.evolvedpros.com'

type ThanksInvite = {
  invite_id: string
  email: string
  first_name: string | null
  status: string
  expires_at: string
}

// POST /api/invite/thanks/claim — redeem a thank-you Community invite by token.
// Grant is community + active only. already_paid / already_member leave the
// users row alone. Never FRIENDSOFGEORGE. Never Stripe. Never VIP/Pro.
export async function POST(request: Request) {
  let body: { token?: unknown }
  try {
    body = (await request.json()) as { token?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!token) return NextResponse.json({ error: 'Missing invite token.' }, { status: 422 })

  const { data: rows, error: rpcErr } = await (adminClient as any).rpc('lookup_thanks_invite', {
    p_token: token,
  })
  if (rpcErr) return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  const invite = (Array.isArray(rows) ? rows[0] : rows) as ThanksInvite | undefined
  if (!invite) return NextResponse.json({ error: 'This invite link is not valid.' }, { status: 404 })
  if (invite.status === 'stopped') {
    return NextResponse.json({ error: 'This invite is no longer active.' }, { status: 403 })
  }
  if (invite.status === 'expired' || new Date(invite.expires_at).getTime() <= Date.now()) {
    await (adminClient as any)
      .from('community_thanks_invites')
      .update({ status: 'expired', next_send_at: null, stopped_reason: 'expired', updated_at: new Date().toISOString() })
      .eq('id', invite.invite_id)
      .neq('status', 'redeemed')
    return NextResponse.json({ error: 'This invite has expired.' }, { status: 410 })
  }

  const email = invite.email.toLowerCase().trim()

  const { data: promo } = await (adminClient as any)
    .from('promo_codes')
    .select('id, code, grants_tier')
    .eq('code', THANKS_PROMO_CODE)
    .maybeSingle()
  if (!promo?.id || promo.code === 'FRIENDSOFGEORGE' || promo.grants_tier !== THANKS_GRANTS_TIER) {
    return NextResponse.json({ error: 'This offer is no longer available.' }, { status: 422 })
  }

  await adminClient.auth.admin.createUser({ email, email_confirm: true }).catch(() => undefined)

  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${APP_URL}/auth/callback?next=%2Fhome` },
  })
  const hashedToken = linkData?.properties?.hashed_token
  if (linkErr || !linkData?.user || !hashedToken) {
    return NextResponse.json({ error: 'Could not start your session.' }, { status: 500 })
  }
  const authUserId = linkData.user.id

  const { data: existingProfile } = await adminClient
    .from('users')
    .select('id, email, tier, tier_status, stripe_subscription_id, stripe_customer_id')
    .eq('email', email)
    .maybeSingle()

  if (!existingProfile) {
    const { error: insErr } = await adminClient.from('users').insert({
      id: authUserId,
      email,
      tier: THANKS_GRANTS_TIER,
      tier_status: THANKS_TIER_STATUS,
    })
    if (insErr) return NextResponse.json({ error: 'Could not create your profile.' }, { status: 500 })
  }

  const member = (existingProfile ?? {
    email,
    tier: THANKS_GRANTS_TIER,
    tier_status: THANKS_TIER_STATUS,
    stripe_subscription_id: null,
    stripe_customer_id: null,
  }) as MemberSnapshot

  const decision = existingProfile
    ? decideThanksGrant(member)
    : { action: 'grant_community' as const }

  let outcome: 'granted' | 'already_paid' | 'already_member' | 'already_redeemed' = 'granted'

  if (decision.action === 'leave_alone') {
    outcome = decision.reason
  } else if (existingProfile) {
    outcome = 'already_member'
  } else {
    const { error: redErr } = await (adminClient as any).from('promo_redemptions').insert({
      promo_code_id: promo.id,
      user_id: authUserId,
      email,
    })
    if (redErr && redErr.code !== '23505') {
      return NextResponse.json({ error: 'Something went wrong applying your access.' }, { status: 500 })
    }
    outcome = redErr?.code === '23505' ? 'already_redeemed' : 'granted'
  }

  const now = new Date().toISOString()
  const leaveAlone = outcome === 'already_paid' || outcome === 'already_member'
  await (adminClient as any)
    .from('community_thanks_invites')
    .update({
      status: leaveAlone && outcome === 'already_paid' ? 'stopped' : 'redeemed',
      redeemed_at: outcome === 'already_paid' ? null : now,
      stopped_reason: outcome === 'already_paid' ? 'already_paid' : outcome === 'already_member' ? 'already_member' : null,
      next_send_at: null,
      updated_at: now,
    })
    .eq('id', invite.invite_id)

  await (adminClient as any)
    .from('community_thanks_nudge_queue')
    .update({ status: 'cancelled' })
    .eq('invite_id', invite.invite_id)
    .eq('status', 'pending_approval')

  if (outcome === 'granted') {
    const write = {
      email,
      user_id: authUserId,
      full_name: invite.first_name,
      tier: THANKS_GRANTS_TIER,
    }
    await bestEffortConversion(
      'POST /api/invite/thanks/claim',
      () => upsertThanksProspect(supabaseIntakeDb, write),
      () => notifyThanksAdmins(supabaseIntakeDb, write),
      true,
    )
  }

  const loginUrl = `${APP_URL}/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink&next=${encodeURIComponent('/home')}`
  return NextResponse.json({
    ok: true,
    tier: THANKS_GRANTS_TIER,
    outcome,
    loginUrl,
  })
}
