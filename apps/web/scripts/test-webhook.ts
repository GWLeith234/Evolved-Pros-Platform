// Run: npx tsx scripts/test-webhook.ts
import { createHmac } from 'crypto'

const SECRET = process.env.VENDASTA_WEBHOOK_SECRET ?? 'test-secret'
const URL    = process.env.WEBHOOK_URL ?? 'http://localhost:3000/api/webhooks/vendasta'

const payload = {
  event_type:    'order.created',
  order_id:      'TEST-ORDER-001',
  contact_id:    'VENDASTA-CONTACT-TEST',
  product_sku:   'EP-COMM-M',
  contact_email: 'testmember@example.com',
  contact_name:  'Test Member',
}

const body = JSON.stringify(payload)
const sig  = createHmac('sha256', SECRET).update(body).digest('hex')

const res = await fetch(URL, {
  method:  'POST',
  headers: { 'Content-Type': 'application/json', 'x-vendasta-signature': sig },
  body,
})

console.log('Status:', res.status)
console.log('Body:',   await res.json())
