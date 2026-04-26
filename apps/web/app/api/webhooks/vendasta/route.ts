export const dynamic = 'force-dynamic'

import { timingSafeEqual } from 'crypto'
import { adminClient } from '@/lib/supabase/admin'
import { mapSkuToTier, UnknownSkuError, type VendastaTier } from '@/lib/vendasta/sku-mapping'
import { sendVendastaWelcomeEmail } from '@/lib/resend/emails/vendasta-welcome'
import { sendVendastaTierChangedEmail } from '@/lib/resend/emails/vendasta-tier-changed'

// ---------------------------------------------------------------------------
// Vendasta automation webhook
//
// Vendasta's automation builder fires this endpoint with a custom JSON body
// (configured per-automation in the Vendasta UI). There is no HMAC signature
// and no event_type — all branching is by current DB state vs payload SKU.
//
// Retry policy (per Alistair):
//   - 401 only for bad verifier token (intentional no-retry)
//   - 2xx for success, duplicate, no-op, and Resend failure (we own that retry)
//   - 5xx for everything else (Vendasta will retry; we ship a fix)
// ---------------------------------------------------------------------------

interface VendastaPayload {
  verifier_token?:      string
  accountId:            string
  orderId:              string
  partnerId?:           string
  marketId?:            string
  sku:                  string
  customer_email:       string
  customer_first_name?: string
  customer_last_name?:  string
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
    return Response.json({ error: 'Invalid JSON' }, { status: 500 })
  }

  // 1) VERIFY TOKEN — header preferred, body fallback
  const headerToken = request.headers.get('x-vendasta-verifier-token') ?? ''
  const bodyToken   = payload.verifier_token ?? ''
  const presented   = headerToken || bodyToken
  if (!presented || !constantTimeEqual(presented, expectedToken)) {
    console.warn('[Vendasta Webhook] Token mismatch — rejecting')
    return Response.json({ error: 'Invalid verifier token' }, { status: 401 })
  }

  const {
    accountId,
    orderId,
    sku,
    customer_email,
    customer_first_name,
    customer_last_name,
  } = payload

  if (!accountId || !orderId || !sku || !customer_email) {
    console.error('[Vendasta Webhook] Missing required fields', {
      hasAccountId: !!accountId,
      hasOrderId:   !!orderId,
      hasSku:       !!sku,
      hasEmail:     !!customer_email,
    })
    return Response.json({ error: 'Missing required fields' }, { status: 500 })
  }

  // 2) IDEMPOTENCY — INSERT with unique event_id; duplicate → 2xx ignored
  const eventId = `${orderId}:${sku}`
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
    // 3) LOOK UP USER by vendasta_account_id (unique)
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

    // 4) BRANCH
    if (!existing) {
      return await handleNewPurchase({
        accountId,
        sku,
        email:     customer_email,
        firstName: customer_first_name ?? '',
        lastName:  customer_last_name ?? '',
      })
    }

    if (existing.vendasta_sku === sku) {
      return await handleRenewal({ accountId })
    }

    return await handleUpgrade({
      accountId,
      sku,
      userId:    existing.id,
      email:     customer_email,
      firstName: customer_first_name ?? '',
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
  // The schema also allows 'vip' (legacy), but the new flow only writes
  // community/pro. Treat anything non-pro as community for tier-change copy.
  return tier === 'pro' ? 'pro' : 'community'
}

// ---------------------------------------------------------------------------
// 5) NEW PURCHASE
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
// 6) UPGRADE
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
// 7) RENEWAL / NO-OP
// ---------------------------------------------------------------------------

async function handleRenewal({ accountId }: { accountId: string }) {
  const { error } = await adminClient
    .from('users')
    .update({ vendasta_last_event_at: new Date().toISOString() })
    .eq('vendasta_account_id', accountId)

  if (error) {
    throw new Error(`users renewal update failed: ${error.message}`)
  }

  return Response.json({ status: 'no_op' })
}
