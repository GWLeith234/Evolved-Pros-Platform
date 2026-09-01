import 'server-only'
import { adminClient } from '@/lib/supabase/admin'

// SPRINT O — redeem a comp / access code ("Friends of George" grants free Pro
// until revoked). Members never touch promo_codes directly; validation runs
// through the validate_promo_code() SECURITY DEFINER RPC (active + capacity),
// and the grant is written with the service-role adminClient (RLS bypass).

export type RedeemResult =
  | { ok: true; grantsTier: string; label: string | null; alreadyRedeemed: boolean }
  | { ok: false; error: 'invalid' | 'error' }

interface ValidCode {
  promo_code_id: string
  grants_tier: string
  price_cents: number
  label: string | null
}

/**
 * Redeem a comp code for a member.
 *
 * @param authUserId auth.users.id — stored on promo_redemptions.user_id (FK).
 * @param email      the member's email — used to write the tier grant by
 *                   email (mirrors onboarding/invite) so it survives the
 *                   documented auth.uid() ≠ public.users.id drift.
 * @param code       the raw code the member typed.
 *
 * Idempotent: a repeat redemption of the same code by the same member returns
 * `alreadyRedeemed: true` and re-affirms the grant rather than erroring.
 */
export async function redeemComp(
  authUserId: string,
  email: string,
  code: string,
): Promise<RedeemResult> {
  const trimmed = code.trim()
  if (!trimmed) return { ok: false, error: 'invalid' }

  // 1. Validate (active + within capacity). Empty result ⇒ invalid/inactive/full.
  const { data: rows, error: rpcErr } = await (adminClient as any).rpc('validate_promo_code', {
    p_code: trimmed,
  })
  if (rpcErr) return { ok: false, error: 'error' }
  const valid = (Array.isArray(rows) ? rows[0] : rows) as ValidCode | undefined
  if (!valid) return { ok: false, error: 'invalid' }

  // 2. Record the redemption. UNIQUE (promo_code_id, user_id) makes this the
  //    idempotency guard, and the AFTER INSERT trigger bumps redemption_count.
  const { error: insErr } = await (adminClient as any)
    .from('promo_redemptions')
    .insert({ promo_code_id: valid.promo_code_id, user_id: authUserId, email })

  let alreadyRedeemed = false
  if (insErr) {
    // 23505 = unique_violation → this member already redeemed this code.
    if (insErr.code === '23505') alreadyRedeemed = true
    else return { ok: false, error: 'error' }
  }

  // 3. Grant the tier. Keyed by email (RLS bypass) and idempotent, so a repeat
  //    redemption safely re-affirms tier / tier_status / comp_promo_code_id.
  const { error: updErr } = await adminClient
    .from('users')
    .update({
      tier: valid.grants_tier,
      tier_status: 'active',
      comp_promo_code_id: valid.promo_code_id,
    })
    .eq('email', email)
  if (updErr) return { ok: false, error: 'error' }

  return {
    ok: true,
    grantsTier: valid.grants_tier,
    label: valid.label,
    alreadyRedeemed,
  }
}
