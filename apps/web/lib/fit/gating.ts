/**
 * Fit is VIP $49. Community sees the tease and upgrade only.
 * Professional inherits VIP (hasTierAccess rank).
 */

import { buildUpgradeHref } from '@/lib/academy/gating'
import { hasTierAccess } from '@/lib/tier'

export const FIT_REQUIRED_TIER = 'vip' as const
export const FIT_UPGRADE_HREF = '/pricing?from=fit&tier=vip'

export function canAccessFitLibrary(userTier: string | null | undefined): boolean {
  return hasTierAccess(userTier, FIT_REQUIRED_TIER)
}

export function fitUpgradeHref(): string {
  return buildUpgradeHref({ from: 'fit', tier: FIT_REQUIRED_TIER })
}
