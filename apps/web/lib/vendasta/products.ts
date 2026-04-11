export type VendastaTier = 'community' | 'vip' | 'pro'

interface ProductConfig {
  tier?:          VendastaTier
  keynote_access?: boolean
  billingPeriod:  'monthly' | 'annual' | 'one_time' | 'free'
  accessMonths?:  number
}

export const VENDASTA_PRODUCTS: Record<string, ProductConfig> = {
  // Community tier (free, no expiry)
  'EP-COMM-FREE': { tier: 'community', billingPeriod: 'free' },
  // VIP tier — $79/month
  'EP-VIP-M':  { tier: 'vip', billingPeriod: 'monthly'  },
  'EP-VIP-Y':  { tier: 'vip', billingPeriod: 'annual'   },
  // Backward-compat aliases (existing customers keep working)
  'EP-COMM-M': { tier: 'vip', billingPeriod: 'monthly'  },
  'EP-COMM-Y': { tier: 'vip', billingPeriod: 'annual'   },
  // Professional tier — $249/month
  'EP-PRO-M':  { tier: 'pro', billingPeriod: 'monthly'  },
  'EP-PRO-Y':  { tier: 'pro', billingPeriod: 'annual'   },
  // Keynote add-on (does NOT change tier)
  'EP-KEY':    { keynote_access: true, billingPeriod: 'one_time', accessMonths: 12 },
  'EP-KEY-Y':  { keynote_access: true, billingPeriod: 'annual'   },
  // Book launch one-time access
  'EP-BOOK':   { tier: 'vip', billingPeriod: 'one_time', accessMonths: 6 },
}

export function getTierExpiry(config: ProductConfig): Date {
  const now = new Date()
  if (config.billingPeriod === 'free')      return addMonths(now, 1200) // 100 years — no expiry
  if (config.billingPeriod === 'monthly')   return addMonths(now, 1)
  if (config.billingPeriod === 'annual')    return addMonths(now, 12)
  if (config.billingPeriod === 'one_time')  return addMonths(now, config.accessMonths ?? 6)
  return addMonths(now, 1)
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}
