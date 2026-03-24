export type VendastaTier = 'community' | 'pro'

interface ProductConfig {
  tier:          VendastaTier
  billingPeriod: 'monthly' | 'annual' | 'one_time'
  accessMonths?: number
}

export const VENDASTA_PRODUCTS: Record<string, ProductConfig> = {
  'EP-COMM-M': { tier: 'community', billingPeriod: 'monthly'  },
  'EP-COMM-Y': { tier: 'community', billingPeriod: 'annual'   },
  'EP-PRO-M':  { tier: 'pro',       billingPeriod: 'monthly'  },
  'EP-PRO-Y':  { tier: 'pro',       billingPeriod: 'annual'   },
  'EP-BOOK':   { tier: 'community', billingPeriod: 'one_time', accessMonths: 6 },
}

export function getTierExpiry(config: ProductConfig): Date {
  const now = new Date()
  if (config.billingPeriod === 'monthly')  return addMonths(now, 1)
  if (config.billingPeriod === 'annual')   return addMonths(now, 12)
  if (config.billingPeriod === 'one_time') return addMonths(now, config.accessMonths ?? 6)
  return addMonths(now, 1)
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}
