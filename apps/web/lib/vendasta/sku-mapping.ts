/**
 * Vendasta SKU → Evolved Pros tier mapping.
 *
 * The mapping is intentionally pattern-based (case-insensitive substring match)
 * because Vendasta marketplace SKUs come in several shapes:
 *   "MP-evolved:EDITION-community"
 *   "MP-evolved:EDITION-pro"
 *   "EP-COMM-M"  /  "EP-COMM-Y"
 *   "EP-PRO-M"   /  "EP-PRO-Y"
 *   "EP-TEST-FREE"
 *
 * Sprint A2 will hand us the production SKU list and we'll wire those in.
 * For now, throwing on an unknown SKU is intentional — the route returns 500
 * so Vendasta retries while we ship a fix.
 */

export type VendastaTier = 'community' | 'pro'

export class UnknownSkuError extends Error {
  readonly sku: string
  constructor(sku: string) {
    super(`Unknown Vendasta SKU: ${sku}`)
    this.name = 'UnknownSkuError'
    this.sku = sku
  }
}

export function mapSkuToTier(sku: string): VendastaTier {
  if (/test|free/i.test(sku)) return 'community'
  if (/pro/i.test(sku))       return 'pro'
  if (/community/i.test(sku)) return 'community'
  throw new UnknownSkuError(sku)
}
