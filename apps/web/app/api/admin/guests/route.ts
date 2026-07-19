export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import { mintGuestToken } from '@/lib/guest/token'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.evolvedpros.com'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /api/admin/guests — admin invites a podcast/keynote guest.
// Body: { email, first_name?, last_name?, full_name?, episode_id? }.
// Creates (or reuses) a guest persona user (role='guest', tier='pro',
// tier_status='comp') and a guest_engagements row with a fresh signed token,
// then returns the durable /guest/[token] intake link. Comped — no Stripe, no
// MRR (see lib/pricing.ts revenue hygiene).
export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 422 })
  }
  const firstName = typeof body.first_name === 'string' ? body.first_name.trim() : ''
  const lastName  = typeof body.last_name === 'string' ? body.last_name.trim() : ''
  const fullName  =
    (typeof body.full_name === 'string' && body.full_name.trim()) ||
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    email
  const episodeId = typeof body.episode_id === 'string' && body.episode_id.trim()
    ? body.episode_id.trim()
    : null

  // 1. Reuse an existing user by email, else create the guest persona row.
  // Cast: stripe_subscription_id is not in the generated Database types yet
  // (added by migration 065), so a typed select would raise SelectQueryError.
  const { data: existing } = await (adminClient as any)
    .from('users')
    .select('id, role, tier_status, stripe_subscription_id')
    .eq('email', email)
    .maybeSingle()

  // Guard: never silently convert a real account into a comped guest. A guest is
  // role='guest' + tier_status='comp' with no Stripe subscription; anything else
  // that already owns this email (an admin, a paying/comped member, or an
  // anomalous "guest" carrying a paid status/subscription) must be refused BEFORE
  // any overwrite or engagement is minted — otherwise the grant here (and the
  // sticky re-assertion in ensureGuestPersona on every /guest view) would strip
  // an admin's role or drop a paying member out of MRR. Re-inviting a genuine
  // existing guest is still allowed.
  if (existing?.id) {
    const existingRole   = String(existing.role ?? '').toLowerCase()
    const existingStatus = String(existing.tier_status ?? '').toLowerCase()
    const hasPaidSub     = Boolean(existing.stripe_subscription_id)
    if (existingRole === 'admin') {
      return NextResponse.json(
        { error: `${email} belongs to an admin account, which can't be converted to a guest.` },
        { status: 409 },
      )
    }
    if (existingRole !== 'guest' || existingStatus !== 'comp' || hasPaidSub) {
      return NextResponse.json(
        { error: `${email} already belongs to an existing member account; refusing to convert a real member into a comped guest.` },
        { status: 409 },
      )
    }
  }

  let userId: string
  if (existing?.id) {
    userId = existing.id
    // Ensure persona/entitlement without clobbering an existing member's names.
    await adminClient
      .from('users')
      .update({ role: 'guest', tier: 'pro', tier_status: 'comp', updated_at: new Date().toISOString() } as any)
      .eq('id', userId)
  } else {
    const { data: created, error: insErr } = await adminClient
      .from('users')
      .insert({
        email,
        role: 'guest',
        tier: 'pro',
        tier_status: 'comp',
        first_name: firstName || null,
        last_name: lastName || null,
        full_name: fullName,
      } as any)
      .select('id')
      .single()
    if (insErr || !created) {
      return NextResponse.json({ error: 'Could not create guest profile.' }, { status: 500 })
    }
    userId = created.id
  }

  // 2. Create the engagement with a fresh signed token.
  const token = mintGuestToken()
  const { data: engagement, error: engErr } = await (adminClient as any)
    .from('guest_engagements')
    .insert({
      user_id: userId,
      episode_id: episodeId,
      access_token: token,
      status: 'invited',
      invited_by: guard.userId,
    })
    .select('id, access_token, token_expires_at')
    .single()
  if (engErr || !engagement) {
    return NextResponse.json({ error: 'Could not create the guest invite.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    engagement_id: engagement.id,
    user_id: userId,
    token: engagement.access_token,
    url: `${APP_URL}/guest/${engagement.access_token}`,
    expires_at: engagement.token_expires_at,
  })
}
