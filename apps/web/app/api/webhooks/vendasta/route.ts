export const dynamic = 'force-dynamic'

import { timingSafeEqual } from 'crypto'
import { adminClient } from '@/lib/supabase/admin'
import { getVendastaToken } from '@/lib/vendasta/oauth'

// ---------------------------------------------------------------------------
// Vendasta automation webhook (V1, May 2026)
//
// Three Partner Center automations POST to this endpoint:
//   1. Account Created  → no orderId in payload
//   2. Order Activated  → orderId in payload, custom body field "event":"order_activated"
//   3. Order Cancelled  → orderId in payload, custom body field "event":"order_cancelled"
//
// All three carry the static verifier token in the `x-vendasta-verifier`
// header. No HMAC — Vendasta's automation builder doesn't sign payloads.
//
// The payload does NOT include the product SKU. To resolve the tier we call
// the Vendasta Orders API with an OAuth bearer token (see lib/vendasta/oauth).
//
// Vendasta's automation runner has a 60-second timeout. To stay well under
// it we acknowledge with 200 immediately, then process in the background.
//
// TODO(george): both order automations currently share this endpoint with no
// way to distinguish activation from cancellation. Add a custom JSON body
// field { "event": "order_activated" } and { "event": "order_cancelled" } in
// each automation in Vendasta Partner Center → Automations. Until that's
// configured, an orderId payload without an `event` field is treated as
// order_activated (safe default — no destructive side effects).
// ---------------------------------------------------------------------------

interface VendastaPayload {
  accountId?: string
  orderId?:   string
  entityId?:  string
  marketId?:  string
  partnerId?: string
  event?:     string
}

type EventType = 'account_created' | 'order_activated' | 'order_cancelled'

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  try {
    return timingSafeEqual(ab, bb)
  } catch {
    return false
  }
}

function classifyEvent(payload: VendastaPayload): EventType {
  if (!payload.orderId) return 'account_created'
  if (payload.event === 'order_cancelled') return 'order_cancelled'
  return 'order_activated'
}

function mapMarketplaceIdToTier(productId: string): 'vip' | 'pro' | null {
  const community = process.env.VENDASTA_MP_COMMUNITY
  const vipM      = process.env.VENDASTA_MP_VIP_M
  const vipY      = process.env.VENDASTA_MP_VIP_Y
  const proM      = process.env.VENDASTA_MP_PRO_M
  const proY      = process.env.VENDASTA_MP_PRO_Y

  if (community && productId === community) return null
  if ((vipM && productId === vipM) || (vipY && productId === vipY)) return 'vip'
  if ((proM && productId === proM) || (proY && productId === proY)) return 'pro'

  console.warn('[Vendasta Webhook] Unknown Marketplace product ID:', productId)
  return null
}

export async function POST(request: Request) {
  const expectedToken = process.env.VENDASTA_VERIFIER_TOKEN
  if (!expectedToken) {
    console.error('[Vendasta Webhook] VENDASTA_VERIFIER_TOKEN is not set')
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const presented = request.headers.get('x-vendasta-verifier') ?? ''
  if (!presented || !constantTimeEqual(presented, expectedToken)) {
    console.warn('[Vendasta Webhook] Verifier token mismatch — rejecting')
    return Response.json({ error: 'Invalid verifier token' }, { status: 401 })
  }

  let payload: VendastaPayload
  try {
    payload = await request.json() as VendastaPayload
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.accountId) {
    console.error('[Vendasta Webhook] Missing accountId in payload', payload)
    return Response.json({ error: 'Missing accountId' }, { status: 400 })
  }

  const eventType = classifyEvent(payload)

  // Acknowledge immediately to stay under Vendasta's 60s automation timeout.
  // Processing continues in the background (Railway runs a long-lived Node
  // server, so unawaited promises keep executing after the response sends).
  void processEvent(eventType, payload).catch(err => {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[Vendasta Webhook] processing failed (${eventType}):`, msg)
  })

  return Response.json({ status: 'received', event: eventType })
}

async function processEvent(eventType: EventType, payload: VendastaPayload): Promise<void> {
  const accountId = payload.accountId!

  switch (eventType) {
    case 'account_created':
      return handleAccountCreated(accountId)
    case 'order_activated':
      return handleOrderActivated(accountId, payload.orderId!)
    case 'order_cancelled':
      return handleOrderCancelled(accountId)
  }
}

async function handleAccountCreated(accountId: string): Promise<void> {
  const { data: existing, error: selectError } = await adminClient
    .from('users')
    .select('id, vendasta_account_id')
    .eq('vendasta_account_id', accountId)
    .maybeSingle()

  if (selectError) {
    throw new Error(`users select failed: ${selectError.message}`)
  }

  const now = new Date().toISOString()

  if (existing) {
    // Row already exists — refresh the last-event timestamp and bail.
    const { error: updateError } = await adminClient
      .from('users')
      .update({ vendasta_last_event_at: now })
      .eq('vendasta_account_id', accountId)
    if (updateError) {
      throw new Error(`users touch failed: ${updateError.message}`)
    }
    return
  }

  const { error: insertError } = await adminClient.from('users').insert({
    vendasta_account_id:              accountId,
    role:                             'member',
    tier:                             null,
    tier_status:                      'active',
    vendasta_subscription_started_at: now,
    vendasta_last_event_at:           now,
  })

  if (insertError) {
    throw new Error(`users insert failed: ${insertError.message}`)
  }
}

async function handleOrderActivated(accountId: string, orderId: string): Promise<void> {
  const token = await getVendastaToken()
  if (!token) {
    throw new Error('Could not obtain Vendasta OAuth token')
  }

  const res = await fetch(`https://prod.apigateway.co/platform/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Vendasta Orders API ${res.status}: ${body.slice(0, 200)}`)
  }

  const order = await res.json() as {
    lineItems?: Array<{ productId?: string }>
  }

  const productId = order.lineItems?.[0]?.productId
  if (!productId) {
    throw new Error(`Order ${orderId} has no lineItems[0].productId`)
  }

  const tier = mapMarketplaceIdToTier(productId)

  const { data: existing, error: selectError } = await adminClient
    .from('users')
    .select('id')
    .eq('vendasta_account_id', accountId)
    .maybeSingle()

  if (selectError) {
    throw new Error(`users select failed: ${selectError.message}`)
  }

  if (!existing) {
    // Account-created webhook hasn't landed yet (or didn't fire). Skip and
    // log — next activation or a manual reconcile will fix it.
    console.warn('[Vendasta Webhook] order_activated for unknown accountId:', accountId)
    return
  }

  const { error: updateError } = await adminClient
    .from('users')
    .update({
      tier,
      tier_status:            'active',
      vendasta_sku:           productId,
      vendasta_last_event_at: new Date().toISOString(),
    })
    .eq('vendasta_account_id', accountId)

  if (updateError) {
    throw new Error(`users tier update failed: ${updateError.message}`)
  }
}

async function handleOrderCancelled(accountId: string): Promise<void> {
  const { error } = await adminClient
    .from('users')
    .update({
      tier:                   null,
      tier_status:            'inactive',
      vendasta_last_event_at: new Date().toISOString(),
    })
    .eq('vendasta_account_id', accountId)

  if (error) {
    throw new Error(`users cancellation update failed: ${error.message}`)
  }
}
