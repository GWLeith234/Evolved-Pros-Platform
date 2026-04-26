/**
 * Vendasta SKU → Evolved Pros tier mapping (Path B canonical: 3-tier vocabulary).
 *
 * Tiers:
 *   community = entry tier (free)
 *   vip       = mid tier ($79/mo)
 *   pro       = top tier ($249/mo)
 *
 * Pattern-based (case-insensitive) because Vendasta marketplace SKUs come in
 * several shapes:
 *   "MP-evolved:EDITION-community"
 *   "MP-evolved:EDITION-pro"
 *   "EP-VIP-M"   /  "EP-VIP-Y"
 *   "EP-PRO-M"   /  "EP-PRO-Y"
 *   "EP-COMM-M"  /  "EP-COMM-Y"   (legacy aliases, now route to community)
 *   "EP-TEST-FREE"
 *
 * Order matters: /vip/i must be checked BEFORE /community|comm|member/i so
 * a hypothetical "EP-COMMUNITY-VIP" SKU would not mis-route. /pro/i is also
 * checked before /community/i so "MP-evolved:EDITION-pro-community-tagline"
 * style SKUs route correctly. UnknownSkuError → 500 → Vendasta retries.
 */

export type VendastaTier = 'community' | 'vip' | 'pro'

export class UnknownSkuError extends Error {
  readonly sku: string
  constructor(sku: string) {
    super(`Unknown Vendasta SKU: ${sku}`)
    this.name = 'UnknownSkuError'
    this.sku = sku
  }
}

export function mapSkuToTier(sku: string): VendastaTier {
  if (/vip/i.test(sku))                       return 'vip'        // top tier
  if (/pro|professional/i.test(sku))          return 'pro'        // mid tier
  if (/community|comm|member/i.test(sku))     return 'community'  // entry tier
  if (/test|free/i.test(sku))                 return 'community'  // test SKUs default to entry
  throw new UnknownSkuError(sku)
}

// Dev-mode self-test: runs once at module load in development.
// Catches mapper regressions before they reach the Vendasta webhook handler
// (where a wrong tier is silent).
if (process.env.NODE_ENV !== 'production') {
  const cases: Array<[string, VendastaTier]> = [
    ['EP-VIP-M',           'vip'],
    ['EP-VIP-Y',           'vip'],
    ['EP-PRO-M',           'pro'],
    ['EP-PROFESSIONAL-Y',  'pro'],
    ['EP-COMM-M',          'community'],
    ['EP-COMMUNITY-Y',     'community'],
    ['EP-MEMBER',          'community'],
    ['EP-TEST-FREE',       'community'],
    ['EP-FREE',            'community'],
  ]
  for (const [sku, expected] of cases) {
    const actual = mapSkuToTier(sku)
    if (actual !== expected) {
      throw new Error(`[sku-mapping self-test] ${sku} → ${actual}, expected ${expected}`)
    }
  }
}
