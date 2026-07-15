export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import { getCatalogue } from '@/lib/commerce/catalogue'
import { mirrorCatalogueToStripe } from '@/lib/stripe/mirror'
import { stripeConfigured } from '@/lib/stripe/config'

// SPRINT I Phase 2 — the admin Products screen reads/writes our own
// products/prices catalogue (source of truth), not the old hardcoded defaults
// + platform_settings + Vendasta SKUs.

async function memberCounts(): Promise<Record<string, number>> {
  const { data: members } = await adminClient
    .from('users')
    .select('tier, tier_status')
    .neq('role', 'admin')
    .in('tier_status', ['active', 'trial'])
  const counts: Record<string, number> = { community: 0, vip: 0, pro: 0, other: 0 }
  for (const m of members ?? []) {
    const t = (m.tier ?? '').toLowerCase()
    if (t === 'community' || t === 'vip' || t === 'pro') counts[t]++
    else counts.other++
  }
  return counts
}

/** GET /api/admin/products — catalogue + member counts + Stripe status. */
export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const [products, counts] = await Promise.all([getCatalogue(), memberCounts()])
  return NextResponse.json({ products, memberCounts: counts, stripeConfigured: stripeConfigured() })
}

interface PriceUpdate {
  id: string
  unit_amount?: number // minor units (cents)
  active?: boolean
  stripe_price_id?: string | null
}
interface ProductUpdate {
  id: string
  active?: boolean
}

/** PATCH /api/admin/products — update catalogue prices / products. */
export async function PATCH(request: Request) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  let body: { priceUpdates?: unknown; productUpdates?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const priceUpdates = Array.isArray(body.priceUpdates) ? (body.priceUpdates as PriceUpdate[]) : []
  const productUpdates = Array.isArray(body.productUpdates) ? (body.productUpdates as ProductUpdate[]) : []

  if (priceUpdates.length === 0 && productUpdates.length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 422 })
  }

  const now = new Date().toISOString()

  for (const u of priceUpdates) {
    if (typeof u.id !== 'string') continue
    const patch: Record<string, unknown> = { updated_at: now }
    if (typeof u.unit_amount === 'number' && Number.isFinite(u.unit_amount) && u.unit_amount >= 0) {
      patch.unit_amount = Math.round(u.unit_amount)
    }
    if (typeof u.active === 'boolean') patch.active = u.active
    if (u.stripe_price_id === null || typeof u.stripe_price_id === 'string') {
      patch.stripe_price_id = u.stripe_price_id ? u.stripe_price_id.trim() : null
    }
    if (Object.keys(patch).length === 1) continue // only updated_at → skip
    const { error } = await (adminClient as any).from('prices').update(patch).eq('id', u.id)
    if (error) {
      console.error('[PATCH /api/admin/products] price update failed', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  for (const u of productUpdates) {
    if (typeof u.id !== 'string' || typeof u.active !== 'boolean') continue
    const { error } = await (adminClient as any)
      .from('products')
      .update({ active: u.active, updated_at: now })
      .eq('id', u.id)
    if (error) {
      console.error('[PATCH /api/admin/products] product update failed', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const products = await getCatalogue()
  return NextResponse.json({ ok: true, products })
}

/** POST /api/admin/products — { action: 'sync-stripe' } mirrors → Stripe. */
export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  let body: { action?: unknown }
  try {
    body = (await request.json()) as { action?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.action !== 'sync-stripe') {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 422 })
  }

  const result = await mirrorCatalogueToStripe()
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Sync failed.' }, { status: 503 })
  }
  const products = await getCatalogue()
  return NextResponse.json({ ok: true, result, products })
}
