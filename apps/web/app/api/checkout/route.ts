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

interface SkuConfig {
  envVar:      string
  sku:         string | undefined
  amountCents: number
  interval:    BillingInterval
  tier:        'vip' | 'pro'
}

function skuCatalog(): Record<string, SkuConfig> {
  return {
    vip_monthly: {
      envVar:      'VENDASTA_VIP_MONTHLY_SKU',
      sku:         process.env.VENDASTA_VIP_MONTHLY_SKU,
      amountCents: 3900,
      interval:    'MONTHLY',
      tier:        'vip',
    },
    vip_annual: {
      envVar:      'VENDASTA_VIP_ANNUAL_SKU',
      sku:         process.env.VENDASTA_VIP_ANNUAL_SKU,
      amountCents: 39000,
      interval:    'YEARLY',
      tier:        'vip',
    },
    pro_monthly: {
      envVar:      'VENDASTA_PRO_MONTHLY_SKU',
      sku:         process.env.VENDASTA_PRO_MONTHLY_SKU,
      amountCents: 7900,
      interval:    'MONTHLY',
      tier:        'pro',
    },
    pro_annual: {
      envVar:      'VENDASTA_PRO_ANNUAL_SKU',
      sku:         process.env.VENDASTA_PRO_ANNUAL_SKU,
      amountCents: 79000,
      interval:    'YEARLY',
      tier:        'pro',
    },
  }
}

function findConfigForSku(requestedSku: string): SkuConfig | null {
  const catalog = skuCatalog()
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
  const cfg = findConfigForSku(sku)
  if (!cfg) {
    console.warn('[Checkout] rejected unknown SKU', { sku, userId: profile.id })
    return NextResponse.json({ error: 'Invalid SKU' }, { status: 422 })
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
