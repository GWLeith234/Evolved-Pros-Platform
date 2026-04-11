export const dynamic = 'force-dynamic'

import { createHmac, timingSafeEqual } from 'crypto'
import { adminClient } from '@/lib/supabase/admin'
import { VENDASTA_PRODUCTS, getTierExpiry } from '@/lib/vendasta/products'
import { sendWelcomeEmail } from '@/lib/resend/emails/welcome'
import { notifyNewMember } from '@/lib/notifications/create'
import { updateContact, removeContactTag } from '@/lib/vendasta/contacts'

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Magic link delivery
// VENDASTA_MAGIC_LINK_METHOD=response   → return in webhook response body (default)
//                           =contact_field → PATCH Vendasta contact custom field
// ---------------------------------------------------------------------------

async function deliverMagicLink(
  vendastaContactId: string,
  magicLink: string,
): Promise<void> {
  const method = process.env.VENDASTA_MAGIC_LINK_METHOD ?? 'response'
  if (method !== 'contact_field') return // Path A: link is already in the response body

  // Path B: write to Vendasta contact custom field so the email template can use it
  const apiKey = process.env.VENDASTA_API_KEY
  if (!apiKey) {
    console.warn('[Vendasta] VENDASTA_API_KEY not set — skipping contact_field delivery')
    return
  }

  // NOTE: Confirm exact endpoint + field name with Brent Yates before enabling.
  // Vendasta Partner API docs: https://developers.vendasta.com
  const url = `https://api-gateway.vendasta.com/api/v1/contacts/${vendastaContactId}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      custom_fields: { platform_magic_link: magicLink },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`[Vendasta] Failed to write magic link to contact ${vendastaContactId}: ${res.status} ${text}`)
  }
}

// ---------------------------------------------------------------------------
// Main POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const rawBody = await request.text()
  const sig     = request.headers.get('x-vendasta-signature') ?? ''
  const secret  = process.env.VENDASTA_WEBHOOK_SECRET

  // If secret is not configured, fail loudly (never silently skip verification)
  if (!secret) {
    console.error('[Vendasta] VENDASTA_WEBHOOK_SECRET is not set')
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

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
    event_type:    string
    order_id:      string
    contact_id:    string
    product_sku:   string
    contact_email: string
    contact_name:  string
  }

  const logBase = { event_type, vendasta_order_id, vendasta_contact_id, product_sku, payload }

  try {
    const { magicLink } = await handleWebhookEvent({
      eventType:         event_type,
      vendastaContactId: vendasta_contact_id,
      email,
      fullName,
      productSku:        product_sku,
    })

    // Deliver magic link via Path B if configured (Path A: already in response)
    if (magicLink) {
      await deliverMagicLink(vendasta_contact_id, magicLink)
    }

    await adminClient.from('vendasta_webhooks').insert({
      ...logBase, status: 'success',
    })

    // Return magic link in body for Path A (Vendasta email template uses {{magic_link}})
    const responseBody: Record<string, unknown> = { ok: true }
    if (magicLink && (process.env.VENDASTA_MAGIC_LINK_METHOD ?? 'response') === 'response') {
      responseBody.magic_link = magicLink
    }
    return Response.json(responseBody)

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await adminClient.from('vendasta_webhooks').insert({
      ...logBase, status: 'error', error_message: message,
    })
    console.error('[Vendasta Webhook Error]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// Event dispatch
// ---------------------------------------------------------------------------

async function handleWebhookEvent({
  eventType, vendastaContactId, email, fullName, productSku,
}: {
  eventType:         string
  vendastaContactId: string
  email:             string
  fullName:          string
  productSku:        string
}): Promise<{ magicLink?: string }> {
  const product = VENDASTA_PRODUCTS[productSku]
  if (!product) throw new Error(`Unknown product SKU: ${productSku}`)

  switch (eventType) {
    case 'order.created':
    case 'order.renewed': {
      // Keynote add-on: flip the flag, do not change tier
      if (product.keynote_access) {
        const magicLink = await grantKeynoteAccess({ vendastaContactId, email, fullName })
        if (eventType === 'order.created' && magicLink) {
          void updateContact(vendastaContactId, {
            tags:   ['keynote-purchaser'],
            fields: { magic_link: magicLink },
          })
        }
        return { magicLink }
      }

      const tierExpiresAt = getTierExpiry(product)
      const { isNewUser, magicLink } = await upsertUser({
        vendastaContactId, email, fullName,
        tier:         product.tier!,
        tierStatus:   'active',
        tierExpiresAt,
      })

      if (isNewUser) {
        await sendWelcomeEmail({ email, fullName, tier: product.tier! })

        const { data: admins } = await adminClient
          .from('users')
          .select('id')
          .eq('role', 'admin')
        const adminIds = (admins ?? []).map((a: { id: string }) => a.id)
        if (adminIds.length > 0) {
          void notifyNewMember({
            adminUserIds:  adminIds,
            newMemberName: fullName,
            newMemberTier: product.tier!,
          })
        }
      }

      if (eventType === 'order.created') {
        // Tag depends on SKU: book purchaser vs tier-based member tag
        const memberTag =
          productSku === 'EP-BOOK'         ? 'book-purchaser'
          : product.tier === 'pro'         ? 'professional-member'
          : product.tier === 'community'   ? 'community-member'
          : /* vip */                        'vip-member'
        const tierLabel =
          product.tier === 'pro'         ? 'Professional'
          : product.tier === 'community' ? 'Community'
          : 'VIP'
        const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? ''
        const checkoutBase = process.env.NEXT_PUBLIC_VENDASTA_CHECKOUT_URL ?? ''
        const contactFields: Record<string, string> = {
          tier:         tierLabel,
          tier_expiry:  tierExpiresAt.toISOString(),
          platform_url: appUrl,
        }
        if (magicLink) contactFields.magic_link = magicLink
        if (checkoutBase) {
          contactFields.vip_checkout_url  = `${checkoutBase}?sku=EP-VIP-M`
          contactFields.book_checkout_url = `${checkoutBase}?sku=EP-BOOK`
        }
        void updateContact(vendastaContactId, { tags: [memberTag], fields: contactFields })
      } else {
        // order.renewed — refresh expiry, clear reminder tag
        void updateContact(vendastaContactId, {
          fields: { tier_expiry: tierExpiresAt.toISOString() },
        })
        void removeContactTag(vendastaContactId, 'renewal-reminder-due')
      }

      return { magicLink }
    }

    case 'order.upgraded': {
      if (product.keynote_access) {
        const magicLink = await grantKeynoteAccess({ vendastaContactId, email, fullName })
        return { magicLink }
      }
      const tierExpiresAt = getTierExpiry(product)
      await upsertUser({
        vendastaContactId, email, fullName,
        tier:         product.tier!,
        tierStatus:   'active',
        tierExpiresAt,
      })
      void updateContact(vendastaContactId, {
        tags:   ['upgraded-to-professional'],
        fields: { tier: 'Professional' },
      })
      return {}
    }

    case 'order.cancelled': {
      await adminClient
        .from('users')
        .update({ tier_status: 'cancelled' })
        .eq('vendasta_contact_id', vendastaContactId)
      void updateContact(vendastaContactId, { tags: ['cancelled'] })
      return {}
    }

    default:
      console.log(`[Vendasta] Unhandled event: ${eventType}`)
      return {}
  }
}

// ---------------------------------------------------------------------------
// grantKeynoteAccess — returns magic link for new users only
// ---------------------------------------------------------------------------

async function grantKeynoteAccess({
  vendastaContactId, email, fullName,
}: {
  vendastaContactId: string
  email:             string
  fullName:          string
}): Promise<string | undefined> {
  const { data: existing } = await adminClient
    .from('users')
    .select('id')
    .eq('vendasta_contact_id', vendastaContactId)
    .maybeSingle()

  if (existing) {
    await adminClient.from('users').update({ keynote_access: true }).eq('id', existing.id)
    return undefined // Existing user — no magic link needed
  }

  // New user purchasing keynote directly — create auth user with vip tier
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
    tier:                'vip',
    tier_status:         'active',
    keynote_access:      true,
    tier_expires_at:     new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  })

  return generateMagicLink(email)
}

// ---------------------------------------------------------------------------
// upsertUser — creates or updates a user, returns magic link for new users
// ---------------------------------------------------------------------------

async function upsertUser({
  vendastaContactId, email, fullName, tier, tierStatus, tierExpiresAt,
}: {
  vendastaContactId: string
  email:             string
  fullName:          string
  tier:              'community' | 'vip' | 'pro'
  tierStatus:        string
  tierExpiresAt:     Date
}): Promise<{ isNewUser: boolean; magicLink?: string }> {
  const { data: existing } = await adminClient
    .from('users')
    .select('id')
    .eq('vendasta_contact_id', vendastaContactId)
    .maybeSingle()

  if (existing) {
    await adminClient.from('users').update({
      tier,
      tier_status:     tierStatus,
      tier_expires_at: tierExpiresAt.toISOString(),
      full_name:       fullName,
      updated_at:      new Date().toISOString(),
    }).eq('id', existing.id)
    return { isNewUser: false }
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

  const magicLink = await generateMagicLink(email)
  return { isNewUser: true, magicLink }
}

// ---------------------------------------------------------------------------
// generateMagicLink — returns the action_link URL string
// ---------------------------------------------------------------------------

async function generateMagicLink(email: string): Promise<string | undefined> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const { data, error } = await adminClient.auth.admin.generateLink({
    type:    'magiclink',
    email,
    options: { redirectTo: `${appUrl}/auth/callback?next=/onboard` },
  })
  if (error) {
    console.error('[Vendasta] Magic link generation failed:', error.message)
    return undefined
  }
  return data.properties?.action_link ?? undefined
}
