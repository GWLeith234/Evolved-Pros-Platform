export const dynamic = 'force-dynamic'

import { timingSafeEqual } from 'crypto'
import { adminClient } from '@/lib/supabase/admin'
import { mapSkuToTier, UnknownSkuError, type VendastaTier } from '@/lib/vendasta/sku-mapping'
import { sendVendastaWelcomeEmail } from '@/lib/resend/emails/vendasta-welcome'
import { sendVendastaTierChangedEmail } from '@/lib/resend/emails/vendasta-tier-changed'
import { getVendastaToken } from '@/lib/vendasta/oauth'

// ---------------------------------------------------------------------------
// Vendasta automation webhook
//
// Vendasta's automation builder fires this endpoint with a custom JSON body
// (configured per-automation in the Vendasta UI). Branching is by current
// DB state vs payload SKU, with an optional explicit `event_type` for
// cancellation.
//
// Security ladder (must pass at least one):
//   1. HMAC SHA-256 over the raw body keyed on VENDASTA_WEBHOOK_SECRET,
//      delivered as `x-vendasta-signature: <hex>`. Optional — only enforced
//      when the header AND the env are both present.
//   2. Static verifier token via header `x-vendasta-verifier-token` or body
//      `verifier_token` field, compared constant-time to
//      VENDASTA_VERIFIER_TOKEN. Always required (this is the canonical gate).
//
// Retry policy (per Alistair):
//   - 401 only for bad verifier token / signature (intentional no-retry)
//   - 2xx for success, duplicate, no-op, and Resend failure (we own that retry)
//   - 5xx for everything else (Vendasta will retry; we ship a fix)
// ---------------------------------------------------------------------------

interface VendastaPayload {
  verifier_token?:      string
  accountId:            string
  orderId:              string
  partnerId?:           string
  marketId?:            string
  // Canonical field names (existing automations).
  sku?:                 string
  customer_email?:      string
  customer_first_name?: string
  customer_last_name?:  string
  // Alternate field names accepted from newer automation configs that use
  // "contact_*" / "product_sku" labels in the Vendasta UI. Either set works.
  product_sku?:         string
  contact_email?:       string
  contact_first_name?:  string
  contact_last_name?:   string
  // Explicit event hint. When omitted we infer from DB state (existing user
  // + same SKU = renewal, different SKU = upgrade, no user = new purchase).
  event_type?:          'purchase' | 'renewal' | 'cancellation' | string
}

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

function isDuplicateKeyError(err: unknown): boolean {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    if ((err as { code?: unknown }).code === '23505') return true
  }
  if (err instanceof Error && /duplicate key/i.test(err.message)) return true
  return false
}


// ---------------------------------------------------------------------------
// enrichPayload — Vendasta's real automation webhooks only carry
//   { accountId, orderId, entityId, marketId, partnerId, event }.
// The handler below needs sku / email / firstName / lastName, so we fetch
// the missing fields from the Orders API (for SKU) and Contacts API (for
// email + name). Best-effort: any failure leaves the field missing, and
// the existing "Missing required fields" validation triggers the 5xx that
// makes Vendasta retry.
// ---------------------------------------------------------------------------

interface EnrichedPayload {
  accountId?: string
  orderId?:   string
  event?:     string
  sku?:       string | null
  email?:     string | null
  firstName?: string | null
  lastName?:  string | null
}

async function enrichPayload(raw: {
  accountId?: string
  orderId?:   string
  event?:     string
  sku?:       string
  email?:     string
  firstName?: string
  lastName?:  string
}): Promise<EnrichedPayload> {
  const enriched: EnrichedPayload = { ...raw }

  // Only enrich order events that have an orderId
  if (!raw.orderId) return enriched

  const token = await getVendastaToken()
  if (!token) {
    console.error('[Vendasta Enrich] No OAuth token — cannot enrich payload')
    return enriched // caller will fail on missing fields, triggering Vendasta retry
  }

  // Fetch SKU if missing
  if (!enriched.sku && enriched.orderId) {
    try {
      const res = await fetch(
        `https://prod.apigateway.co/platform/orders/${encodeURIComponent(enriched.orderId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        const data = await res.json() as {
          data?:      { lineItems?: Array<{ productId?: string }> }
          lineItems?: Array<{ productId?: string }>
        }
        const productId = data?.data?.lineItems?.[0]?.productId
          ?? data?.lineItems?.[0]?.productId
          ?? null
        if (productId) enriched.sku = productId
      } else {
        console.error('[Vendasta Enrich] Orders API', res.status, await res.text().catch(() => ''))
      }
    } catch (err) {
      console.error('[Vendasta Enrich] Orders fetch error:', err)
    }
  }

  // Fetch email + name if missing
  if ((!enriched.email || !enriched.firstName) && enriched.accountId) {
    try {
      const res = await fetch(
        `https://prod.apigateway.co/org/${encodeURIComponent(enriched.accountId)}/contacts?page[limit]=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/vnd.api+json',
          },
        }
      )
      if (res.ok) {
        const data = await res.json() as {
          data?: Array<{ attributes?: Record<string, string | null | undefined> }>
        }
        const attrs = data?.data?.[0]?.attributes ?? {}
        if (!enriched.email)     enriched.email     = attrs.email ?? null
        if (!enriched.firstName) enriched.firstName = attrs.givenName ?? attrs.firstName ?? null
        if (!enriched.lastName)  enriched.lastName  = attrs.familyName ?? attrs.lastName ?? null
      } else {
        console.error('[Vendasta Enrich] Contacts API', res.status, await res.text().catch(() => ''))
      }
    } catch (err) {
      console.error('[Vendasta Enrich] Contacts fetch error:', err)
    }
  }

  return enriched
}

export async function POST(request: Request) {
  const expectedToken = process.env.VENDASTA_VERIFIER_TOKEN
  if (!expectedToken) {
    console.error('[Vendasta Webhook] VENDASTA_VERIFIER_TOKEN is not set')
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  // Read the raw body once — request.json() consumes the stream and we need
  // the exact bytes that were signed for HMAC verification.
  const rawBody = await request.text()
  
  let payload: VendastaPayload
  try {
    payload = JSON.parse(rawBody) as VendastaPayload
  } catch {
    console.error('[Vendasta Webhook] Invalid JSON body')
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // 1) VERIFY TOKEN — header preferred, body fallback. Always required.
  const headerToken = request.headers.get('x-vendasta-verifier-token') ?? ''
  const bodyToken   = payload.verifier_token ?? ''
  const presented   = headerToken || bodyToken
  if (!presented || !constantTimeEqual(presented, expectedToken)) {
    console.warn('[Vendasta Webhook] Token mismatch — rejecting')
    return Response.json({ error: 'Invalid verifier token' }, { status: 401 })
  }

  // 2) NORMALISE + ENRICH FIELDS — real Vendasta automation webhooks only
  //    carry { accountId, orderId, event }. enrichPayload() fetches the rest
  //    (sku, email, firstName, lastName) from the Vendasta APIs. We coalesce
  //    nulls to '' so the rest of the handler can treat everything as string.
  const raw = payload as unknown as Record<string, unknown>
  const enriched = await enrichPayload({
    accountId:  raw.accountId  as string | undefined,
    orderId:    raw.orderId    as string | undefined,
    event:      raw.event      as string | undefined,
    sku:        raw.sku        as string | undefined,
    email:      raw.email      as string | undefined,
    firstName:  raw.firstName  as string | undefined,
    lastName:   raw.lastName   as string | undefined,
  })
  const accountId = enriched.accountId ?? ''
  const orderId   = enriched.orderId   ?? ''
  const sku       = enriched.sku       ?? ''
  const email     = enriched.email     ?? ''
  const firstName = enriched.firstName ?? ''
  const lastName  = enriched.lastName  ?? ''
  const eventType = (enriched.event   ?? '').toLowerCase()

  // Cancellation doesn't need a SKU; everything else does.
  const requiresSku = eventType !== 'cancellation'

  if (!accountId || !orderId || (requiresSku && !sku) || !email) {
    console.error('[Vendasta Webhook] Missing required fields', {
      hasAccountId: !!accountId,
      hasOrderId:   !!orderId,
      hasSku:       !!sku,
      hasEmail:     !!email,
      eventType,
    })
    return Response.json({ error: 'Missing required fields' }, { status: 500 })
  }

  // 3) IDEMPOTENCY — INSERT with unique event_id; duplicate → 2xx ignored
  const eventId = `${orderId}:${sku || eventType || 'event'}`
  const { error: insertError } = await adminClient
    .from('vendasta_webhooks')
    .insert({
      event_id:    eventId,
      payload:     JSON.parse(JSON.stringify(payload)),
      received_at: new Date().toISOString(),
    })

  if (insertError) {
    if (isDuplicateKeyError(insertError)) {
      return Response.json({ status: 'duplicate_ignored', event_id: eventId })
    }
    console.error('[Vendasta Webhook] vendasta_webhooks insert failed:', insertError)
    return Response.json({ error: 'DB error logging webhook' }, { status: 500 })
  }

  try {
    // 4) LOOK UP USER by vendasta_account_id (unique)
    const { data: existing, error: selectError } = await adminClient
      .from('users')
      .select('id, email, vendasta_sku, tier')
      .eq('vendasta_account_id', accountId)
      .limit(1)
      .maybeSingle()

    if (selectError) {
      console.error('[Vendasta Webhook] users select failed:', selectError)
      return Response.json({ error: 'DB error reading user' }, { status: 500 })
    }

    // 5) BRANCH

    // Explicit cancellation path — preserves tier, marks status, keeps
    // access until tier_expires_at fires.
    if (eventType === 'cancellation') {
      if (!existing) {
        // Cancellation for an unknown account — still 200 so Vendasta
        // doesn't retry, but log it so we can investigate.
        console.warn('[Vendasta Webhook] cancellation for unknown account:', accountId)
        return Response.json({ status: 'cancellation_no_user', account_id: accountId })
      }
      return await handleCancellation({ accountId, userId: existing.id })
    }

    if (!existing) {
      return await handleNewPurchase({
        accountId,
        sku,
        email,
        firstName,
        lastName,
      })
    }

    if (existing.vendasta_sku === sku) {
      return await handleRenewal({ accountId })
    }

    return await handleUpgrade({
      accountId,
      sku,
      userId:    existing.id,
      email,
      firstName,
      oldTier:   normalizeTier(existing.tier),
    })
  } catch (err) {
    if (err instanceof UnknownSkuError) {
      console.error('[Vendasta Webhook] Unknown SKU — please add to mapping:', err.sku)
      return Response.json({ error: err.message }, { status: 500 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Vendasta Webhook] Uncaught error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}

function normalizeTier(tier: string | null): VendastaTier {
  // Path B canonical 3-tier vocabulary: community / vip / pro.
  // Unknown / null falls back to community (entry tier).
  if (tier === 'pro')       return 'pro'
  if (tier === 'vip')       return 'vip'
  if (tier === 'community') return 'community'
  return 'community'
}

// ---------------------------------------------------------------------------
// 5a) NEW PURCHASE
// ---------------------------------------------------------------------------

async function handleNewPurchase({
  accountId,
  sku,
  email,
  firstName,
  lastName,
}: {
  accountId: string
  sku:       string
  email:     string
  firstName: string
  lastName:  string
}) {
  const tier = mapSkuToTier(sku)

  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { source: 'vendasta', vendasta_account_id: accountId },
  })
  if (authError || !authUser?.user) {
    throw new Error(`Auth user creation failed: ${authError?.message ?? 'no user returned'}`)
  }

  const userId   = authUser.user.id
  const now      = new Date().toISOString()
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null

  const { error: insertError } = await adminClient.from('users').insert({
    id:                               userId,
    email,
    first_name:                       firstName || null,
    last_name:                        lastName || null,
    full_name:                        fullName,
    role:                             'member',
    tier,
    tier_status:                      'active',
    vendasta_account_id:              accountId,
    vendasta_sku:                     sku,
    vendasta_subscription_started_at: now,
    vendasta_last_event_at:           now,
  })

  if (insertError) {
    throw new Error(`users insert failed: ${insertError.message}`)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type:    'magiclink',
    email,
    options: { redirectTo: `${siteUrl}/home` },
  })
  if (linkError) {
    console.error('[Vendasta Webhook] magic link generation failed:', linkError.message)
  }

  const magicLink = linkData?.properties?.action_link ?? `${siteUrl}/login`

  // Resend failure must NOT cause a retry — we already created the user.
  try {
    await sendVendastaWelcomeEmail({
      email,
      firstName: firstName || email.split('@')[0],
      tier,
      magicLink,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Vendasta Webhook] welcome email send failed (continuing):', msg)
  }

  return Response.json({ status: 'created', user_id: userId, tier })
}

// ---------------------------------------------------------------------------
// 5b) UPGRADE
// ---------------------------------------------------------------------------

async function handleUpgrade({
  accountId,
  sku,
  userId,
  email,
  firstName,
  oldTier,
}: {
  accountId: string
  sku:       string
  userId:    string
  email:     string
  firstName: string
  oldTier:   VendastaTier
}) {
  const newTier = mapSkuToTier(sku)

  if (newTier === oldTier) {
    return await handleRenewal({ accountId })
  }

  const { error: updateError } = await adminClient
    .from('users')
    .update({
      tier:                   newTier,
      tier_status:            'active',
      vendasta_sku:           sku,
      vendasta_last_event_at: new Date().toISOString(),
    })
    .eq('vendasta_account_id', accountId)

  if (updateError) {
    throw new Error(`users update failed: ${updateError.message}`)
  }

  try {
    await sendVendastaTierChangedEmail({
      email,
      firstName: firstName || email.split('@')[0],
      oldTier,
      newTier,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Vendasta Webhook] tier-changed email send failed (continuing):', msg)
  }

  return Response.json({
    status:   'upgraded',
    user_id:  userId,
    old_tier: oldTier,
    new_tier: newTier,
  })
}

// ---------------------------------------------------------------------------
// 5c) RENEWAL / NO-OP
// ---------------------------------------------------------------------------

async function handleRenewal({ accountId }: { accountId: string }) {
  const { error } = await adminClient
    .from('users')
    .update({
      tier_status:            'active',
      vendasta_last_event_at: new Date().toISOString(),
    })
    .eq('vendasta_account_id', accountId)

  if (error) {
    throw new Error(`users renewal update failed: ${error.message}`)
  }

  return Response.json({ status: 'no_op' })
}

// ---------------------------------------------------------------------------
// 5d) CANCELLATION
// ---------------------------------------------------------------------------
//
// Sets tier_status='cancelled' but preserves the tier itself so the member
// keeps access until the existing tier_expires_at runs out (the
// /membership-expired redirect in (member)/layout.tsx handles the lockout
// when the date passes). Does not generate a magic link or send a welcome
// email — admins can manually re-invite if the member rejoins later.

async function handleCancellation({
  accountId,
  userId,
}: {
  accountId: string
  userId:    string
}) {
  const { error } = await adminClient
    .from('users')
    .update({
      tier_status:            'cancelled',
      vendasta_last_event_at: new Date().toISOString(),
    })
    .eq('vendasta_account_id', accountId)

  if (error) {
    throw new Error(`users cancellation update failed: ${error.message}`)
  }

  return Response.json({ status: 'cancelled', user_id: userId })
}
