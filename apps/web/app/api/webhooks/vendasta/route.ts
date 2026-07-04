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
// DB state vs payload SKU, with an optional explicit `event` for
// cancellation.
//
// Verification: static verifier token via header `x-vendasta-verifier-token`
// (body `verifier_token` fallback), compared constant-time to
// VENDASTA_VERIFIER_TOKEN. There is no HMAC/signature scheme.
//
// Retry policy (per Alistair):
//   - 401 only for a bad verifier token (intentional no-retry)
//   - 2xx for success, already-processed duplicate, no-op, deliberate skip,
//     and Resend failure (we own that retry)
//   - 5xx for everything else — the vendasta_webhooks row is marked failed,
//     so Vendasta's retry actually reprocesses instead of being swallowed
//     as a duplicate
// ---------------------------------------------------------------------------

// The fields actually read off the payload. Real automation webhooks usually
// carry only { accountId, orderId, event } — enrichPayload() backfills sku /
// email / firstName / lastName from the Orders and Contacts APIs.
interface VendastaPayload {
  verifier_token?: string
  accountId?:      string
  orderId?:        string
  partnerId?:      string
  marketId?:       string
  // Explicit event hint. When omitted we infer from DB state (existing user
  // + same SKU = renewal, different SKU = upgrade, no user = new purchase).
  event?:          'purchase' | 'renewal' | 'cancellation' | string
  sku?:            string
  email?:          string
  firstName?:      string
  lastName?:       string
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
// vendasta_webhooks status vocabulary. The live table carries
//   CHECK (status IN ('success','error'))   -- vendasta_webhooks_status_check
// and schema changes are off the table, so the three logical states map to:
//   processed → 'success'  (terminal — the ONLY state treated as a duplicate)
//   failed    → 'error'    (redelivery reprocesses it)
//   in-flight → NULL       (row claimed, processing not finished; reprocessable)
// Deliberate no-ops (cancellation for an unknown account) are stored as
// 'success' with a descriptive event_type so they never retry.
// ---------------------------------------------------------------------------
const STATUS_PROCESSED = 'success'
const STATUS_FAILED    = 'error'

// Stamp the outcome onto the vendasta_webhooks row. Best-effort: a failure
// here must not turn a processed event into a 5xx (Vendasta would redeliver
// and the three-way user lookup makes that reprocess a harmless renewal).
async function finalizeWebhookLog(
  logId: string | null,
  fields: { status: string; eventType?: string; errorMessage?: string | null },
) {
  if (!logId) return
  const { error } = await adminClient
    .from('vendasta_webhooks')
    .update({
      status:        fields.status,
      error_message: fields.errorMessage ?? null,
      processed_at:  new Date().toISOString(),
      ...(fields.eventType ? { event_type: fields.eventType } : {}),
    })
    .eq('id', logId)
  if (error) {
    console.error('[Vendasta Webhook] failed to finalize log row:', error.message)
  }
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

  let payload: VendastaPayload
  try {
    payload = (await request.json()) as VendastaPayload
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
  const enriched = await enrichPayload({
    accountId:  payload.accountId,
    orderId:    payload.orderId,
    event:      payload.event,
    sku:        payload.sku,
    email:      payload.email,
    firstName:  payload.firstName,
    lastName:   payload.lastName,
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

  // 3) IDEMPOTENCY — status-based. Only a row already marked processed
  //    ('success') is a duplicate. A failed or in-flight row means the last
  //    attempt didn't finish: claim it and reprocess, so a Vendasta retry
  //    after a 5xx actually does the work instead of being dropped forever.
  const eventId = `${orderId}:${sku || eventType || 'event'}`

  const { data: existingLog, error: logSelectError } = await adminClient
    .from('vendasta_webhooks')
    .select('id, status')
    .eq('event_id', eventId)
    .maybeSingle()

  if (logSelectError) {
    console.error('[Vendasta Webhook] vendasta_webhooks select failed:', logSelectError)
    return Response.json({ error: 'DB error reading webhook log' }, { status: 500 })
  }

  if (existingLog?.status === STATUS_PROCESSED) {
    return Response.json({ status: 'duplicate_ignored', event_id: eventId })
  }

  let logId = existingLog?.id ?? null
  if (!logId) {
    const { data: insertedLog, error: insertError } = await adminClient
      .from('vendasta_webhooks')
      .insert({
        event_id:          eventId,
        payload:           JSON.parse(JSON.stringify(payload)),
        received_at:       new Date().toISOString(),
        event_type:        eventType || null,
        product_sku:       sku || null,
        vendasta_order_id: orderId,
        status:            null, // in-flight
        error_message:     null,
      })
      .select('id')
      .single()

    if (insertError) {
      if (isDuplicateKeyError(insertError)) {
        // Concurrent delivery inserted the row between our select and insert.
        const { data: raced } = await adminClient
          .from('vendasta_webhooks')
          .select('id, status')
          .eq('event_id', eventId)
          .maybeSingle()
        if (raced?.status === STATUS_PROCESSED) {
          return Response.json({ status: 'duplicate_ignored', event_id: eventId })
        }
        logId = raced?.id ?? null
      } else {
        console.error('[Vendasta Webhook] vendasta_webhooks insert failed:', insertError)
        return Response.json({ error: 'DB error logging webhook' }, { status: 500 })
      }
    } else {
      logId = insertedLog?.id ?? null
    }
  } else {
    // Redelivery of a failed / unfinished event — refresh the attempt and
    // clear the previous error before reprocessing.
    await adminClient
      .from('vendasta_webhooks')
      .update({
        payload:           JSON.parse(JSON.stringify(payload)),
        event_type:        eventType || null,
        product_sku:       sku || null,
        vendasta_order_id: orderId,
        status:            null, // in-flight again
        error_message:     null,
      })
      .eq('id', logId)
  }

  // 4) PROCESS — on success mark the log processed; on any error mark it
  //    failed with the message and 5xx so Vendasta retries (and the retry
  //    reprocesses, per the status-based idempotency above).
  try {
    const { response, resolvedEventType } = await processEvent({
      accountId,
      sku,
      email,
      firstName,
      lastName,
      eventType,
    })
    await finalizeWebhookLog(logId, {
      status:    STATUS_PROCESSED,
      eventType: resolvedEventType,
    })
    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await finalizeWebhookLog(logId, { status: STATUS_FAILED, errorMessage: message })
    if (err instanceof UnknownSkuError) {
      console.error('[Vendasta Webhook] Unknown SKU — please add to mapping:', err.sku)
      return Response.json({ error: err.message }, { status: 500 })
    }
    console.error('[Vendasta Webhook] Uncaught error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// processEvent — three-way user lookup + branch.
//   1) users.vendasta_account_id = accountId → renewal / upgrade / cancel
//   2) else users.email = email              → existing member's first
//      purchase: link the account to their row, never createUser (which
//      threw "email already registered" and 500'd every such purchase)
//   3) else                                  → genuinely new member
// resolvedEventType is what gets stamped on vendasta_webhooks.event_type.
// ---------------------------------------------------------------------------

async function processEvent({
  accountId,
  sku,
  email,
  firstName,
  lastName,
  eventType,
}: {
  accountId: string
  sku:       string
  email:     string
  firstName: string
  lastName:  string
  eventType: string
}): Promise<{ response: Response; resolvedEventType: string }> {
  // 1) by vendasta_account_id (unique)
  const { data: byAccount, error: accountError } = await adminClient
    .from('users')
    .select('id, email, vendasta_sku, tier')
    .eq('vendasta_account_id', accountId)
    .limit(1)
    .maybeSingle()

  if (accountError) {
    throw new Error(`users select by vendasta_account_id failed: ${accountError.message}`)
  }

  // Explicit cancellation path — preserves tier, marks status, keeps
  // access until tier_expires_at fires.
  if (eventType === 'cancellation') {
    if (!byAccount) {
      // Cancellation for an unknown account — still 200 so Vendasta
      // doesn't retry, but log it so we can investigate.
      console.warn('[Vendasta Webhook] cancellation for unknown account:', accountId)
      return {
        response: Response.json({ status: 'cancellation_no_user', account_id: accountId }),
        resolvedEventType: 'cancellation_no_user',
      }
    }
    return {
      response: await handleCancellation({ accountId, userId: byAccount.id }),
      resolvedEventType: 'cancellation',
    }
  }

  if (byAccount) {
    if (byAccount.vendasta_sku === sku) {
      return {
        response: await handleRenewal({ accountId }),
        resolvedEventType: 'renewal',
      }
    }
    return {
      response: await handleUpgrade({
        accountId,
        sku,
        userId:  byAccount.id,
        email,
        firstName,
        oldTier: normalizeTier(byAccount.tier),
      }),
      resolvedEventType: 'upgrade',
    }
  }

  // 2) by email — same resolution the app's write paths use. An existing
  //    member buying through Vendasta for the first time has no
  //    vendasta_account_id yet; link the purchase to their row.
  const { data: byEmail, error: emailError } = await adminClient
    .from('users')
    .select('id, tier')
    .eq('email', email)
    .limit(1)
    .maybeSingle()

  if (emailError) {
    throw new Error(`users select by email failed: ${emailError.message}`)
  }

  if (byEmail) {
    return {
      response: await handleLinkExistingUser({
        accountId,
        sku,
        userId:  byEmail.id,
        email,
        firstName,
        oldTier: normalizeTier(byEmail.tier),
      }),
      resolvedEventType: 'purchase_linked_existing',
    }
  }

  // 3) genuinely new — no account match and no email match
  return {
    response: await handleNewPurchase({ accountId, sku, email, firstName, lastName }),
    resolvedEventType: 'purchase',
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
// 5a-bis) LINK EXISTING USER — first Vendasta purchase by someone who already
// has a public.users row (matched by email). Updates that row in place:
// tier + vendasta_account_id + vendasta_sku + subscription timestamps.
// Never calls auth.admin.createUser — that threw "email already registered"
// and 500'd every existing member's purchase with no tier change.
// ---------------------------------------------------------------------------

async function handleLinkExistingUser({
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
  const now     = new Date().toISOString()

  const { error: updateError } = await adminClient
    .from('users')
    .update({
      tier:                             newTier,
      tier_status:                      'active',
      vendasta_account_id:              accountId,
      vendasta_sku:                     sku,
      vendasta_subscription_started_at: now,
      vendasta_last_event_at:           now,
    })
    .eq('id', userId)

  if (updateError) {
    throw new Error(`users link-existing update failed: ${updateError.message}`)
  }

  // Resend failure must NOT cause a retry — the row is already updated.
  if (newTier !== oldTier) {
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
  }

  return Response.json({
    status:  'linked_existing',
    user_id: userId,
    tier:    newTier,
  })
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
