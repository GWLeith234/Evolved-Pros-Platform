/**
 * Membership product catalog for admin Products page.
 * Display prices + Vendasta SKU wiring (env + optional platform_settings overrides).
 */

export type MembershipTierKey = 'community' | 'vip' | 'pro'

export interface MembershipProduct {
  key: MembershipTierKey
  /** CRM stage alias (professional → pro) */
  crmStage: 'community' | 'vip' | 'professional'
  label: string
  tagline: string
  priceMonthly: number
  priceAnnual: number | null
  accent: string
  features: string[]
  /** Live checkout SKUs (from env / settings) */
  skuMonthly: string
  skuAnnual: string
  vendastaUrl: string
}

const VENDASTA_PRODUCTS_URL =
  'https://www.vendasta.com/marketplace/'

/** Default catalog matching the membership ladder used in CRM. */
export const DEFAULT_MEMBERSHIP_PRODUCTS: Omit<
  MembershipProduct,
  'skuMonthly' | 'skuAnnual' | 'vendastaUrl'
>[] = [
  {
    key: 'community',
    crmStage: 'community',
    label: 'Community',
    tagline: 'Free entry membership',
    priceMonthly: 0,
    priceAnnual: null,
    accent: '#0ABFA3',
    features: [
      'Community feed access',
      'Weekly live events (community tier)',
      'Public media & podcast',
    ],
  },
  {
    key: 'vip',
    crmStage: 'vip',
    label: 'VIP',
    tagline: 'Core membership',
    priceMonthly: 9,
    priceAnnual: 90,
    accent: '#C9A84C',
    features: [
      'Full Academy pillars (VIP)',
      'Accountability tools',
      'Member community access',
    ],
  },
  {
    key: 'pro',
    crmStage: 'professional',
    label: 'Professional',
    tagline: 'Full system access',
    priceMonthly: 49,
    priceAnnual: 490,
    accent: '#C9302A',
    features: [
      'All VIP features',
      'Pro-gated Academy content',
      'Priority event access',
    ],
  },
]

export const PRODUCT_SETTING_KEYS = {
  vipPrice: 'membership_vip_price_mo',
  proPrice: 'membership_pro_price_mo',
  vipAnnual: 'membership_vip_price_yr',
  proAnnual: 'membership_pro_price_yr',
  vipSkuM: 'membership_vip_sku_m',
  vipSkuY: 'membership_vip_sku_y',
  proSkuM: 'membership_pro_sku_m',
  proSkuY: 'membership_pro_sku_y',
  communitySku: 'membership_community_sku',
} as const

export function readEnvSkus(): Record<MembershipTierKey, { monthly: string; annual: string }> {
  return {
    community: {
      monthly: process.env.VENDASTA_MP_COMMUNITY ?? process.env.NEXT_PUBLIC_VENDASTA_MP_COMMUNITY ?? '',
      annual: '',
    },
    vip: {
      monthly: process.env.NEXT_PUBLIC_VENDASTA_MP_VIP_M ?? '',
      annual: process.env.NEXT_PUBLIC_VENDASTA_MP_VIP_Y ?? '',
    },
    pro: {
      monthly: process.env.NEXT_PUBLIC_VENDASTA_MP_PRO_M ?? '',
      annual: process.env.NEXT_PUBLIC_VENDASTA_MP_PRO_Y ?? '',
    },
  }
}

export function buildMembershipProducts(
  settings: Record<string, string>,
): MembershipProduct[] {
  const env = readEnvSkus()
  const num = (key: string, fallback: number) => {
    const raw = settings[key]
    if (raw == null || raw === '') return fallback
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
  }

  return DEFAULT_MEMBERSHIP_PRODUCTS.map(base => {
    if (base.key === 'community') {
      const sku = settings[PRODUCT_SETTING_KEYS.communitySku] || env.community.monthly
      return {
        ...base,
        skuMonthly: sku,
        skuAnnual: '',
        vendastaUrl: sku
          ? `https://business.vendasta.com/marketplace/products?q=${encodeURIComponent(sku)}`
          : VENDASTA_PRODUCTS_URL,
      }
    }
    if (base.key === 'vip') {
      const skuM = settings[PRODUCT_SETTING_KEYS.vipSkuM] || env.vip.monthly
      const skuY = settings[PRODUCT_SETTING_KEYS.vipSkuY] || env.vip.annual
      return {
        ...base,
        priceMonthly: num(PRODUCT_SETTING_KEYS.vipPrice, base.priceMonthly),
        priceAnnual: num(PRODUCT_SETTING_KEYS.vipAnnual, base.priceAnnual ?? 90),
        skuMonthly: skuM,
        skuAnnual: skuY,
        vendastaUrl: skuM
          ? `https://business.vendasta.com/marketplace/products?q=${encodeURIComponent(skuM)}`
          : VENDASTA_PRODUCTS_URL,
      }
    }
    // pro
    const skuM = settings[PRODUCT_SETTING_KEYS.proSkuM] || env.pro.monthly
    const skuY = settings[PRODUCT_SETTING_KEYS.proSkuY] || env.pro.annual
    return {
      ...base,
      priceMonthly: num(PRODUCT_SETTING_KEYS.proPrice, base.priceMonthly),
      priceAnnual: num(PRODUCT_SETTING_KEYS.proAnnual, base.priceAnnual ?? 490),
      skuMonthly: skuM,
      skuAnnual: skuY,
      vendastaUrl: skuM
        ? `https://business.vendasta.com/marketplace/products?q=${encodeURIComponent(skuM)}`
        : VENDASTA_PRODUCTS_URL,
    }
  })
}
