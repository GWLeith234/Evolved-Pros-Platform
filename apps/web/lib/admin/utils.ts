// Pure utility functions — no server-only, safe to import in client components.

import { tierMonthlyPrice } from '@/lib/pricing'

export type EngagementLevel = 'High' | 'Med' | 'Low'

export function getEngagementLevel(postsLast30: number, lessonsLast30: number): EngagementLevel {
  const score = postsLast30 * 2 + lessonsLast30
  if (score >= 10) return 'High'
  if (score >= 3)  return 'Med'
  return 'Low'
}

export function getEngagementScore(postsLast30: number, lessonsLast30: number): number {
  return postsLast30 * 2 + lessonsLast30
}

/**
 * Per-member monthly MRR. Delegates to the canonical price table in
 * lib/pricing so tier prices live in exactly one place (fixes the old
 * hardcoded VIP=$79). Kept as a thin wrapper because many admin routes/pages
 * import it directly.
 */
export function getTierMrr(tier: string | null, tierStatus: string | null): number {
  return tierMonthlyPrice(tier, tierStatus)
}

export function getVendastaCrmUrl(contactId: string): string {
  return `https://business.vendasta.com/crm/contacts/${contactId}`
}
