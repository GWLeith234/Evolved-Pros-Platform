import { createHmac, timingSafeEqual } from 'crypto'
import { adminClient } from '@/lib/supabase/admin'
import { VENDASTA_PRODUCTS, getTierExpiry } from '@/lib/vendasta/products'
import { sendWelcomeEmail } from '@/lib/resend/emails/welcome'

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const rawBody  = await request.text()
  const sig      = request.headers.get('x-vendasta-signature') ?? ''
  const secret   = process.env.VENDASTA_WEBHOOK_SECRET!

  if (!verifySignature(rawBody, sig, secret)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    event_type,
    order_id:      vendasta_order_id,
    contact_id:    vendasta_contact_id,
    product_sku,
    contact_email: email,
    contact_name:  fullName,
  } = payload as {
    event_type: string
    order_id: string
    contact_id: string
    product_sku: string
    contact_email: string
    contact_name: string
  }

  const logBase = { event_type, vendasta_order_id, vendasta_contact_id, product_sku, payload }

  try {
    await handleWebhookEvent({
      eventType:          event_type,
      vendastaContactId:  vendasta_contact_id,
      email,
      fullName,
      productSku:         product_sku,
    })

    await adminClient.from('vendasta_webhooks').insert({
      ...logBase, status: 'success',
    })

    return Response.json({ ok: true })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await adminClient.from('vendasta_webhooks').insert({
      ...logBase, status: 'error', error_message: message,
    })
    console.error('[Vendasta Webhook Error]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}

async function handleWebhookEvent({
  eventType, vendastaContactId, email, fullName, productSku,
}: {
  eventType:         string
  vendastaContactId: string
  email:             string
  fullName:          string
  productSku:        string
}) {
  const product = VENDASTA_PRODUCTS[productSku]
  if (!product) throw new Error(`Unknown product SKU: ${productSku}`)

  switch (eventType) {
    case 'order.created':
    case 'order.renewed': {
      const tierExpiresAt = getTierExpiry(product)
      const isNewUser = await upsertUser({
        vendastaContactId, email, fullName,
        tier:        product.tier,
        tierStatus:  'active',
        tierExpiresAt,
      })
      if (isNewUser) {
        await sendWelcomeEmail({ email, fullName, tier: product.tier })
      }
      break
    }

    case 'order.upgraded': {
      const tierExpiresAt = getTierExpiry(product)
      await upsertUser({
        vendastaContactId, email, fullName,
        tier:        product.tier,
        tierStatus:  'active',
        tierExpiresAt,
      })
      break
    }

    case 'order.cancelled': {
      await adminClient
        .from('users')
        .update({ tier_status: 'cancelled' })
        .eq('vendasta_contact_id', vendastaContactId)
      break
    }

    default:
      console.log(`[Vendasta] Unhandled event: ${eventType}`)
  }
}

async function upsertUser({
  vendastaContactId, email, fullName, tier, tierStatus, tierExpiresAt,
}: {
  vendastaContactId: string
  email:             string
  fullName:          string
  tier:              'community' | 'pro'
  tierStatus:        string
  tierExpiresAt:     Date
}): Promise<boolean> {
  const { data: existing } = await adminClient
    .from('users')
    .select('id')
    .eq('vendasta_contact_id', vendastaContactId)
    .maybeSingle()

  if (existing) {
    await adminClient.from('users').update({
      tier,
      tier_status:    tierStatus,
      tier_expires_at: tierExpiresAt.toISOString(),
      full_name:      fullName,
      updated_at:     new Date().toISOString(),
    }).eq('id', existing.id)
    return false
  }

  // New user — create Supabase Auth user
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (authError) throw new Error(`Auth user creation failed: ${authError.message}`)

  await adminClient.from('users').insert({
    id:                  authUser.user.id,
    vendasta_contact_id: vendastaContactId,
    email,
    full_name:           fullName,
    tier,
    tier_status:         tierStatus,
    tier_expires_at:     tierExpiresAt.toISOString(),
  })

  // Send magic link for first-time access
  await adminClient.auth.admin.generateLink({
    type:    'magiclink',
    email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboard` },
  })

  return true
}
