/**
 * End-to-end test for the Vendasta webhook handler (V1 model).
 *
 * Usage:
 *   VENDASTA_VERIFIER_TOKEN=<token> \
 *   npx ts-node scripts/test-vendasta-webhook.ts [options]
 *
 * Options:
 *   --event   account_created | order_activated | order_cancelled  (default: account_created)
 *   --account Vendasta accountId  (default: test-account-<timestamp>)
 *   --order   Vendasta orderId   (default: test-order-<timestamp>; ignored for account_created)
 *   --url     Webhook URL        (default: http://localhost:3000)
 *   --dry-run Print payload only, do not POST
 */

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------

function arg(flag: string, fallback: string): string {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 ? (process.argv[idx + 1] ?? fallback) : fallback
}

type Event = 'account_created' | 'order_activated' | 'order_cancelled'

const EVENT     = arg('--event',   'account_created') as Event
const ACCOUNT   = arg('--account', `test-account-${Date.now()}`)
const ORDER     = arg('--order',   `test-order-${Date.now()}`)
const BASE_URL  = arg('--url',     'http://localhost:3000')
const DRY_RUN   = process.argv.includes('--dry-run')

const token = process.env.VENDASTA_VERIFIER_TOKEN
if (!token) {
  console.error('❌  VENDASTA_VERIFIER_TOKEN env var is required')
  process.exit(1)
}

const payload: Record<string, unknown> = {
  accountId: ACCOUNT,
  marketId:  'test-market',
  partnerId: 'test-partner',
}
if (EVENT !== 'account_created') {
  payload.orderId = ORDER
  payload.event   = EVENT
}

console.log('\n=== Vendasta Webhook Test ===')
console.log(`Event:    ${EVENT}`)
console.log(`Account:  ${ACCOUNT}`)
console.log(`Endpoint: ${BASE_URL}/api/webhooks/vendasta`)
console.log(`Payload:  ${JSON.stringify(payload)}`)

if (DRY_RUN) {
  console.log('\n[dry-run] Not sending request.')
  process.exit(0)
}

async function run() {
  const res = await fetch(`${BASE_URL}/api/webhooks/vendasta`, {
    method: 'POST',
    headers: {
      'Content-Type':        'application/json',
      'x-vendasta-verifier': token!,
    },
    body: JSON.stringify(payload),
  })
  const body = await res.text()
  console.log(`\nHTTP ${res.status} ${res.statusText}`)
  console.log('Response:', body)
  if (!res.ok) process.exit(1)
}

run().catch(err => {
  console.error('\n❌  Unexpected error:', err)
  process.exit(1)
})
