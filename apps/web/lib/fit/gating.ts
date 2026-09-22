/**
 * Fit access. SPRINT L - the decision now comes from the entitlement matrix
 * rather than a rank compare done here, so "what does VIP include" is answered
 * in exactly one file. The 99 inherits it by being in the matrix, not by
 * outranking VIP.
 */

import { buildUpgradeHref } from '@/lib/academy/gating'
import { canAccessFit, requiredTierFor } from '@/lib/entitlements'

export const FIT_REQUIRED_TIER = requiredTierFor('fit')
export const FIT_UPGRADE_HREF = `/pricing?from=fit&tier=${FIT_REQUIRED_TIER}`

export function canAccessFitLibrary(userTier: string | null | undefined): boolean {
  return canAccessFit(userTier)
}

export function fitUpgradeHref(): string {
  return buildUpgradeHref({ from: 'fit', tier: FIT_REQUIRED_TIER })
}
