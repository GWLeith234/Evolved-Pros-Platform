export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { redeemComp } from '@/lib/promo/redeemComp'
import {
  bestEffortConversion,
  notifyWelcomeAdmins,
  upsertWelcomeProspect,
} from '@/lib/crm/conversion'
import { supabaseIntakeDb } from '@/lib/crm/intakeDb'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.evolvedpros.com'

// POST /api/welcome/claim — redeem a Friends of George invite by token.
// Body: { token: string }.
//
// The invite token is the credential (magic-link trust model). We:
//   1. resolve the invite (SECURITY DEFINER RPC — works before auth),
//   2. ensure the invitee has an auth user + public.users row,
//   3. apply redeemComp (Sprint O) — grants the comp tier, records the
//      redemption, bumps redemption_count,
//   4. mark the invite redeemed,
//   5. hand the browser a Supabase magic action-link so the EXISTING
//      /auth/callback flow logs them in — no bespoke session code here.
//
// This is unauthenticated by design (a fresh browser can claim), which is why
// it lives outside the middleware auth matcher.
export async function POST(request: Request) {
  let body: { token?: unknown }
  try {
    body = (await request.json()) as { token?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!token) return NextResponse.json({ error: 'Missing invite token.' }, { status: 422 })

  // 1. Resolve the invite.
  const { data: rows, error: rpcErr } = await (adminClient as any).rpc('lookup_friend_invite', {
    p_token: token,
  })
  if (rpcErr) return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  const invite = (Array.isArray(rows) ? rows[0] : rows) as
    | { invite_id: string; email: string; promo_code_id: string | null; status: string }
    | undefined
  if (!invite) return NextResponse.json({ error: 'This invite link is not valid.' }, { status: 404 })
  if (invite.status === 'revoked') {
    return NextResponse.json({ error: 'This invite has been revoked.' }, { status: 403 })
  }

  const email = invite.email.toLowerCase().trim()

  // 2. Resolve the comp code text (redeemComp validates by code string).
  let codeText = 'FRIENDSOFGEORGE'
  if (invite.promo_code_id) {
    const { data: code } = await (adminClient as any)
      .from('promo_codes')
      .select('code')
      .eq('id', invite.promo_code_id)
      .maybeSingle()
    if (code?.code) codeText = code.code
  }

  // 3. Ensure an auth user exists, then mint the login action-link (also gives
  //    us the auth user id). createUser errors harmlessly if already present.
  await adminClient.auth.admin
    .createUser({ email, email_confirm: true })
    .catch(() => undefined)

  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${APP_URL}/auth/callback?next=%2Fhome` },
  })
  // We use the hashed_token (NOT the action_link): the action_link's verify step
  // redirects with the session in the URL *fragment* (implicit flow), which the
  // server-side /auth/callback can't read — that was the auth_failed bug. Passing
  // token_hash to the callback uses its verifyOtp path, which runs server-side and
  // sets the session cookies on a real top-level navigation.
  const hashedToken = linkData?.properties?.hashed_token
  if (linkErr || !linkData?.user || !hashedToken) {
    return NextResponse.json({ error: 'Could not start your session.' }, { status: 500 })
  }
  const authUserId = linkData.user.id

  // 4. Ensure a public.users row exists (no handle_new_user trigger in-tree),
  //    so redeemComp's email-keyed tier grant lands somewhere.
  const { data: existingProfile } = await adminClient
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (!existingProfile) {
    const { error: insErr } = await adminClient.from('users').insert({ id: authUserId, email })
    if (insErr) return NextResponse.json({ error: 'Could not create your profile.' }, { status: 500 })
  }

  // 5. Apply the comp (idempotent).
  const result = await redeemComp(authUserId, email, codeText)
  if (!result.ok) {
    const status = result.error === 'invalid' ? 422 : 500
    const message =
      result.error === 'invalid'
        ? 'This offer is no longer available.'
        : 'Something went wrong applying your access.'
    return NextResponse.json({ error: message }, { status })
  }

  // 6. Mark the invite redeemed (leave an already-redeemed invite as-is).
  await (adminClient as any)
    .from('friend_invites')
    .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
    .eq('id', invite.invite_id)
    .neq('status', 'revoked')

  const welcomeWrite = {
    email,
    user_id: authUserId,
    tier: result.grantsTier,
  }
  await bestEffortConversion(
    'POST /api/welcome/claim',
    () => upsertWelcomeProspect(supabaseIntakeDb, welcomeWrite),
    () => notifyWelcomeAdmins(supabaseIntakeDb, welcomeWrite),
    !result.alreadyRedeemed,
  )

  // 7. Hand back a callback URL carrying the token_hash. The client navigates
  //    to it (top-level GET); /auth/callback verifyOtp's it into a session and
  //    lands the invitee on /home, now logged in with their new Pro access.
  const loginUrl = `${APP_URL}/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink&next=${encodeURIComponent('/home')}`
  return NextResponse.json({
    ok: true,
    tier: result.grantsTier,
    loginUrl,
  })
}
