// Run: npx tsx scripts/test-webhook.ts
const TOKEN = process.env.VENDASTA_VERIFIER_TOKEN ?? 'test-token'
const ENDPOINT = process.env.WEBHOOK_URL ?? 'http://localhost:3000/api/webhooks/vendasta'

const payload = {
  accountId: 'TEST-ACCOUNT-001',
  marketId:  'test-market',
  partnerId: 'test-partner',
}

async function main() {
  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-vendasta-verifier': TOKEN },
    body:    JSON.stringify(payload),
  })
  console.log('Status:', res.status)
  console.log('Body:',   await res.json())
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

export {}
