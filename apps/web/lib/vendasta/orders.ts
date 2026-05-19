/**
 * Vendasta Sales Orders helper — submits an order and returns the hosted
 * payment URL we redirect the member to.
 *
 * POST https://prod.apigateway.co/platform/orders
 *   Authorization: Bearer <client_credentials token>
 *   Content-Type:  application/vnd.api+json
 *   Body: JSON:API envelope containing accountGroupId + a single line item.
 *
 * ASSUMPTION (per sprint spec): the response includes a hosted payment URL.
 * Field name is not contractually fixed by Vendasta docs we've seen, so we
 * scan a list of plausible keys. If none are present we log the full response
 * and throw — the caller surfaces "No payment URL in Vendasta order response —
 * inspect logs" so we don't silently redirect to undefined.
 */

import { getCheckoutToken } from '@/lib/vendasta/auth'

const ORDERS_URL = 'https://prod.apigateway.co/platform/orders'

export type BillingInterval = 'MONTHLY' | 'YEARLY'

export class VendastaOrdersError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VendastaOrdersError'
  }
}

interface OrderResponse {
  data?: {
    id?:         string
    attributes?: Record<string, unknown>
    links?:      Record<string, string | undefined>
  }
  links?:        Record<string, string | undefined>
  paymentUrl?:   string
  checkoutUrl?:  string
}

function pickPaymentUrl(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as OrderResponse

  const attrs = (o.data?.attributes ?? {}) as Record<string, unknown>
  const links = (o.data?.links ?? o.links ?? {}) as Record<string, unknown>

  const candidates: unknown[] = [
    attrs.paymentUrl,
    attrs.payment_url,
    attrs.checkoutUrl,
    attrs.checkout_url,
    attrs.hostedPaymentUrl,
    attrs.hosted_payment_url,
    attrs.url,
    links.payment,
    links.checkout,
    links.self,
    o.paymentUrl,
    o.checkoutUrl,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && /^https?:\/\//i.test(c)) return c
  }
  return null
}

export async function createOrder(
  agid:        string,
  sku:         string,
  amountCents: number,
  interval:    BillingInterval,
): Promise<{ paymentUrl: string; orderId: string | null; raw: unknown }> {
  const token = await getCheckoutToken()

  const body = {
    data: {
      type:       'orders',
      attributes: {
        accountGroupId: agid,
        lineItems: [
          {
            sku,
            quantity:   1,
            amount:     amountCents,
            currency:   'USD',
            interval,
          },
        ],
      },
    },
  }

  const res = await fetch(ORDERS_URL, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/vnd.api+json',
      Accept:         'application/vnd.api+json',
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  if (!res.ok) {
    console.error('[Vendasta Orders] create failed', res.status, text.slice(0, 500))
    throw new VendastaOrdersError(
      `orders POST ${res.status}: ${text.slice(0, 300)}`,
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new VendastaOrdersError('orders response not JSON')
  }

  // Always log the response so we can pin down the real payment URL field.
  console.info('[Vendasta Orders] response:', JSON.stringify(parsed).slice(0, 1000))

  const paymentUrl = pickPaymentUrl(parsed)
  if (!paymentUrl) {
    throw new VendastaOrdersError(
      'No payment URL in Vendasta order response — inspect logs',
    )
  }

  const orderId =
    (parsed as OrderResponse).data?.id ?? null

  return { paymentUrl, orderId, raw: parsed }
}
