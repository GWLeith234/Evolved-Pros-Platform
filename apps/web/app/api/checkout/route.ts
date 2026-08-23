/**
 * POST /api/checkout — SPRINT V-CHECKOUT
 *
 * Server-side Vendasta Sales Orders flow. Replaces the legacy storefront link
 * (NEXT_PUBLIC_VENDASTA_CHECKOUT_URL) which required Business App account
 * creation. The member here is already authenticated, so we:
 *   1. Look up / create a Vendasta Account Group keyed off public.users
 *   2. Submit an order containing the requested SKU
 *   3. Return the hosted payment URL Vendasta hands back
 *
 * Body:  { sku: string }
 * Reply: { paymentUrl: string } on success
 *        { error: string }      on any failure
 *
 * SKU is gated to the 4 env-configured values (VIP/PRO × MONTHLY/YEARLY) so a
 * client cannot ask us to submit an order for arbitrary products.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { getOrCreateAccountGroup } from '@/lib/vendasta/accounts'
import { createOrder, type BillingInterval } from '@/lib/vendasta/orders'
import { alreadyEntitledTo } from '@/lib/stripe/purchaseGuard'
import { getMembershipPricing } from '@/lib/commerce/catalogue'
import { planAmountCents, type PaidPlanKey } from '@/lib/pricing'

interface SkuConfig {
  envVar:      string
  sku:         string | undefined
  amountCents: number
  interval:    BillingInterval
  tier:        'vip' | 'pro'
  plan:        PaidPlanKey
}

function skuCatalog(amountFor: (plan: PaidPlanKey) => number): Record<PaidPlanKey, SkuConfig> {
  return {
    vip_monthly: {
      envVar:      'NEXT_PUBLIC_VENDASTA_MP_VIP_M',
      sku:         process.env.NEXT_PUBLIC_VENDASTA_MP_VIP_M,
      amountCents: amountFor('vip_monthly'),
      interval:    'MONTHLY',
      tier:        'vip',
      plan:        'vip_monthly',
    },
    vip_annual: {
      envVar:      'NEXT_PUBLIC_VENDASTA_MP_VIP_Y',
      sku:         process.env.NEXT_PUBLIC_VENDASTA_MP_VIP_Y,
      amountCents: amountFor('vip_annual'),
      interval:    'YEARLY',
      tier:        'vip',
      plan:        'vip_annual',
    },
    pro_monthly: {
      envVar:      'NEXT_PUBLIC_VENDASTA_MP_PRO_M',
      sku:         process.env.NEXT_PUBLIC_VENDASTA_MP_PRO_M,
      amountCents: amountFor('pro_monthly'),
      interval:    'MONTHLY',
      tier:        'pro',
      plan:        'pro_monthly',
    },
    pro_annual: {
      envVar:      'NEXT_PUBLIC_VENDASTA_MP_PRO_Y',
      sku:         process.env.NEXT_PUBLIC_VENDASTA_MP_PRO_Y,
      amountCents: amountFor('pro_annual'),
      interval:    'YEARLY',
      tier:        'pro',
      plan:        'pro_annual',
    },
  }
}

function findConfigForSku(
  requestedSku: string,
  amountFor: (plan: PaidPlanKey) => number,
): SkuConfig | null {
  const catalog = skuCatalog(amountFor)
  for (const cfg of Object.values(catalog)) {
    if (cfg.sku && cfg.sku === requestedSku) return cfg
  }
  return null
}

export async function POST(request: Request) {
  // 1. Auth gate
  const supabase = createClient()
  const profile  = await resolveCurrentUser(supabase)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Body validation
  let body: { sku?: unknown }
  try {
    body = (await request.json()) as { sku?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const sku = typeof body.sku === 'string' ? body.sku.trim() : ''
  if (!sku) {
    return NextResponse.json({ error: 'sku is required' }, { status: 422 })
  }

  // 3. SKU allowlist — must match one of the four env-configured values
  const { tiers } = await getMembershipPricing()
  const amountFor = (plan: PaidPlanKey) => planAmountCents(plan, tiers)
  const cfg = findConfigForSku(sku, amountFor)
  if (!cfg) {
    console.warn('[Checkout] rejected unknown SKU', { sku, userId: profile.id })
    return NextResponse.json({ error: 'Invalid SKU' }, { status: 422 })
  }

  // 3b. Same repurchase guard as /api/stripe/checkout — a live VIP must not
  // open a second Vendasta order because the UI hid the button.
  if (alreadyEntitledTo(profile.tier, profile.tier_status, cfg.plan)) {
    return NextResponse.json(
      { error: 'alreadyEntitledTo', plan: cfg.plan },
      { status: 409 },
    )
  }

  if (!profile.email) {
    return NextResponse.json(
      { error: 'Account missing email — contact support' },
      { status: 400 },
    )
  }

  // 4. Account Group + Order
  try {
    const agid = await getOrCreateAccountGroup(
      profile.id,
      profile.email,
      profile.full_name ?? null,
    )
    const { paymentUrl } = await createOrder(
      agid,
      cfg.sku!,
      cfg.amountCents,
      cfg.interval,
    )
    return NextResponse.json({ paymentUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed'
    console.error('[Checkout]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
