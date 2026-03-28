/**
 * End-to-end test for the Vendasta webhook handler.
 *
 * Usage:
 *   VENDASTA_WEBHOOK_SECRET=<secret> \
 *   SUPABASE_SERVICE_ROLE_KEY=<key> \
 *   SUPABASE_URL=<url> \
 *   npx ts-node scripts/test-vendasta-webhook.ts [--sku EP-VIP-M] [--email test@example.com] [--url http://localhost:3000]
 *
 * Options:
 *   --sku     Product SKU to test (default: EP-VIP-M)
 *   --email   Contact email (default: test+webhook@evolvedpros.com)
 *   --url     Webhook URL (default: http://localhost:3000)
 *   --event   Event type (default: order.created)
 *   --dry-run Print payload + signature only, do not POST
 */

import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------

function arg(flag: string, fallback: string): string {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 ? (process.argv[idx + 1] ?? fallback) : fallback
}

const SKU        = arg('--sku',   'EP-VIP-M')
const EMAIL      = arg('--email', 'test+webhook@evolvedpros.com')
const BASE_URL   = arg('--url',   'http://localhost:3000')
const EVENT_TYPE = arg('--event', 'order.created')
const DRY_RUN    = process.argv.includes('--dry-run')

// ---------------------------------------------------------------------------
// Build payload
// ---------------------------------------------------------------------------

const CONTACT_ID = `test-contact-${Date.now()}`
const ORDER_ID   = `test-order-${Date.now()}`

const payload = {
  event_type:    EVENT_TYPE,
  order_id:      ORDER_ID,
  contact_id:    CONTACT_ID,
  product_sku:   SKU,
  contact_email: EMAIL,
  contact_name:  'Test Member',
}

const body = JSON.stringify(payload)

// ---------------------------------------------------------------------------
// Sign the payload
// ---------------------------------------------------------------------------

const secret = process.env.VENDASTA_WEBHOOK_SECRET
if (!secret) {
  console.error('❌  VENDASTA_WEBHOOK_SECRET env var is required')
  process.exit(1)
}

const signature = createHmac('sha256', secret).update(body).digest('hex')

// ---------------------------------------------------------------------------
// Print summary
// ---------------------------------------------------------------------------

console.log('\n=== Vendasta Webhook Test ===')
console.log(`Event:    ${EVENT_TYPE}`)
console.log(`SKU:      ${SKU}`)
console.log(`Email:    ${EMAIL}`)
console.log(`Contact:  ${CONTACT_ID}`)
console.log(`Endpoint: ${BASE_URL}/api/webhooks/vendasta`)
console.log(`Payload:  ${body}`)
console.log(`Sig:      ${signature}`)

if (DRY_RUN) {
  console.log('\n[dry-run] Not sending request.')
  process.exit(0)
}

// ---------------------------------------------------------------------------
// POST the webhook
// ---------------------------------------------------------------------------

async function run() {
  console.log('\n--- Sending webhook... ---')

  const res = await fetch(`${BASE_URL}/api/webhooks/vendasta`, {
    method: 'POST',
    headers: {
      'Content-Type':          'application/json',
      'x-vendasta-signature':  signature,
    },
    body,
  })

  const responseText = await res.text()
  let responseJson: Record<string, unknown> | null = null
  try { responseJson = JSON.parse(responseText) } catch { /* not JSON */ }

  console.log(`\nHTTP ${res.status} ${res.statusText}`)
  console.log('Response:', responseJson ?? responseText)

  if (!res.ok) {
    console.error('\n❌  Webhook returned an error.')
    process.exit(1)
  }

  // Check for magic link in response (Path A)
  if (responseJson?.magic_link) {
    console.log('\n✅  Magic link received (Path A):')
    console.log(`    ${responseJson.magic_link}`)
  } else {
    console.log('\nℹ️  No magic link in response body (either Path B or existing user).')
  }

  // ---------------------------------------------------------------------------
  // Verify Supabase row was created
  // ---------------------------------------------------------------------------

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.log('\n⚠️  SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY not set — skipping DB check.')
    return
  }

  console.log('\n--- Checking Supabase for new user row... ---')

  const supabase = createClient(supabaseUrl, serviceKey)
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, tier, tier_status, keynote_access, vendasta_contact_id, created_at')
    .eq('vendasta_contact_id', CONTACT_ID)
    .maybeSingle()

  if (error) {
    console.error('❌  Supabase query error:', error.message)
    process.exit(1)
  }

  if (!user) {
    console.error('❌  No user row found in public.users for contact_id:', CONTACT_ID)
    console.log('    This may be expected if the webhook created an existing user (update path).')
    process.exit(1)
  }

  console.log('\n✅  User row found in public.users:')
  console.log(`    id:                  ${user.id}`)
  console.log(`    email:               ${user.email}`)
  console.log(`    tier:                ${user.tier}`)
  console.log(`    tier_status:         ${user.tier_status}`)
  console.log(`    keynote_access:      ${user.keynote_access}`)
  console.log(`    vendasta_contact_id: ${user.vendasta_contact_id}`)
  console.log(`    created_at:          ${user.created_at}`)

  // Verify tier matches SKU
  const expectedTierBySku: Record<string, string> = {
    'EP-VIP-M':  'vip',
    'EP-VIP-Y':  'vip',
    'EP-COMM-M': 'vip',
    'EP-COMM-Y': 'vip',
    'EP-PRO-M':  'pro',
    'EP-PRO-Y':  'pro',
    'EP-BOOK':   'vip',
    'EP-KEY':    'vip',  // keynote adds flag, tier stays as-is (vip for new user)
    'EP-KEY-Y':  'vip',
  }
  const expected = expectedTierBySku[SKU]
  if (expected && user.tier !== expected) {
    console.error(`\n❌  Tier mismatch: expected '${expected}', got '${user.tier}'`)
    process.exit(1)
  }

  if (['EP-KEY', 'EP-KEY-Y'].includes(SKU) && !user.keynote_access) {
    console.error('\n❌  keynote_access should be true for keynote SKUs')
    process.exit(1)
  }

  console.log('\n✅  All assertions passed.')
}

run().catch(err => {
  console.error('\n❌  Unexpected error:', err)
  process.exit(1)
})
