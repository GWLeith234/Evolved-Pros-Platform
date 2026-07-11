export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import {
  PRODUCT_SETTING_KEYS,
  buildMembershipProducts,
} from '@/lib/admin/products'

const ALLOWED_KEYS = new Set<string>(Object.values(PRODUCT_SETTING_KEYS))

/** GET /api/admin/products — membership catalog + member counts + SKUs */
export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const keys = Object.values(PRODUCT_SETTING_KEYS)
  const [{ data: settingsRows }, { data: members }] = await Promise.all([
    adminClient.from('platform_settings').select('key, value').in('key', keys),
    adminClient
      .from('users')
      .select('tier, tier_status')
      .neq('role', 'admin')
      .in('tier_status', ['active', 'trial']),
  ])

  const settings: Record<string, string> = {}
  for (const row of settingsRows ?? []) {
    if (row.key && row.value != null) settings[row.key] = String(row.value)
  }

  const products = buildMembershipProducts(settings)

  const counts: Record<string, number> = { community: 0, vip: 0, pro: 0, other: 0 }
  for (const m of members ?? []) {
    const t = (m.tier ?? '').toLowerCase()
    if (t === 'community' || t === 'vip' || t === 'pro') counts[t]++
    else counts.other++
  }

  return NextResponse.json({
    products,
    memberCounts: counts,
    settings,
    vendastaCrm: 'https://business.vendasta.com/crm/contacts',
    vendastaMarketplace: 'https://business.vendasta.com/marketplace',
  })
}

/** PATCH /api/admin/products — upsert price/SKU overrides into platform_settings */
export async function PATCH(request: Request) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates = body.settings
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return NextResponse.json({ error: 'settings object is required' }, { status: 422 })
  }

  const rows: { key: string; value: string; updated_at: string }[] = []
  const now = new Date().toISOString()
  for (const [key, val] of Object.entries(updates as Record<string, unknown>)) {
    if (!ALLOWED_KEYS.has(key)) continue
    if (val === null || val === undefined) continue
    rows.push({ key, value: String(val).trim(), updated_at: now })
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No valid settings to update' }, { status: 422 })
  }

  const { error } = await adminClient.from('platform_settings').upsert(rows, { onConflict: 'key' })
  if (error) {
    console.error('[PATCH /api/admin/products]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return refreshed catalog
  const { data: settingsRows } = await adminClient
    .from('platform_settings')
    .select('key, value')
    .in('key', Object.values(PRODUCT_SETTING_KEYS))

  const settings: Record<string, string> = {}
  for (const row of settingsRows ?? []) {
    if (row.key && row.value != null) settings[row.key] = String(row.value)
  }

  return NextResponse.json({
    ok: true,
    products: buildMembershipProducts(settings),
    settings,
  })
}
