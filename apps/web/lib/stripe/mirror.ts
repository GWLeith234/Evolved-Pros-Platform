import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { getStripe, stripeConfigured } from '@/lib/stripe/config'
import { getCatalogue } from '@/lib/commerce/catalogue'

// ---------------------------------------------------------------------------
// Catalogue → Stripe mirror (SPRINT I Phase 2, TEST MODE).
// Our products/prices are the source of truth; this pushes them into Stripe.
// Idempotent: any product/price already carrying a Stripe id is skipped, so
// re-running only fills in what's missing (and prices an admin pasted in by
// hand are left alone). Community / $0 memberships have no purchasable price
// and are skipped.
// ---------------------------------------------------------------------------

export interface MirrorResult {
  ok: boolean
  productsCreated: number
  pricesCreated: number
  skipped: string[]
  error?: string
}

export async function mirrorCatalogueToStripe(): Promise<MirrorResult> {
  if (!stripeConfigured()) {
    return {
      ok: false,
      productsCreated: 0,
      pricesCreated: 0,
      skipped: [],
      error: 'Stripe is not configured (STRIPE_SECRET_KEY missing).',
    }
  }

  const stripe = getStripe()
  const catalogue = await getCatalogue()
  let productsCreated = 0
  let pricesCreated = 0
  const skipped: string[] = []
  const now = () => new Date().toISOString()

  for (const product of catalogue) {
    if (!product.active) {
      skipped.push(`${product.slug} (product inactive)`)
      continue
    }

    // 1. Ensure a Stripe product.
    let stripeProductId = product.stripe_product_id
    if (!stripeProductId) {
      const sp = await stripe.products.create({
        name: product.name,
        description: product.description ?? undefined,
        metadata: { catalogue_product_id: product.id, slug: product.slug },
      })
      stripeProductId = sp.id
      await (adminClient as any)
        .from('products')
        .update({ stripe_product_id: stripeProductId, updated_at: now() })
        .eq('id', product.id)
      productsCreated++
    }

    // 2. Ensure a Stripe price for each active, purchasable price.
    for (const price of product.prices) {
      if (!price.active) continue
      if (price.stripe_price_id) continue
      if (price.unit_amount <= 0) {
        skipped.push(`${product.slug} ${price.interval} ($0 — not purchasable)`)
        continue
      }
      const sp = await stripe.prices.create({
        product: stripeProductId,
        currency: price.currency,
        unit_amount: price.unit_amount,
        recurring: price.interval === 'one_time' ? undefined : { interval: price.interval },
        metadata: { catalogue_price_id: price.id },
      })
      await (adminClient as any)
        .from('prices')
        .update({ stripe_price_id: sp.id, updated_at: now() })
        .eq('id', price.id)
      pricesCreated++
    }
  }

  return { ok: true, productsCreated, pricesCreated, skipped }
}
