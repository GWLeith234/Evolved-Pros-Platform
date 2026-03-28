// Pure utility functions — no server-only, safe to import in client components.

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

export function getTierMrr(tier: string | null, tierStatus: string | null): number {
  if (!tierStatus || tierStatus === 'cancelled' || tierStatus === 'expired') return 0
  if (tier === 'pro') return 79
  if (tier === 'vip' || tier === 'community') return 39
  return 0
}

export function getVendastaCrmUrl(contactId: string): string {
  return `https://business.vendasta.com/crm/contacts/${contactId}`
}
