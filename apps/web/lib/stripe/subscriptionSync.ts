import { toTierKey } from '@/lib/entitlements'

/**
 * Whether a subscription.updated event may write the member's tier.
 *
 * 'sync'  — this is the subscription already stored on the user.
 * 'adopt' — the user is on the free tier with no subscription, and this one
 *           is live. The paid-conversion safety net when checkout.completed
 *           has not landed yet.
 * 'ignore'— anything else. An overflow cancel, a second subscription, or a
 *           comp (paid tier, no subscription id) must not be overwritten.
 */
export function shouldApplySubscriptionUpdate(opts: {
  storedSubscriptionId: string | null | undefined
  eventSubscriptionId: string
  eventStatus: string
  storedTier: string | null | undefined
}): 'sync' | 'adopt' | 'ignore' {
  if (opts.storedSubscriptionId && opts.storedSubscriptionId === opts.eventSubscriptionId) {
    return 'sync'
  }
  const live = opts.eventStatus === 'active' || opts.eventStatus === 'trialing'
  const communityWithoutSub =
    !opts.storedSubscriptionId && toTierKey(opts.storedTier) === 'community'
  if (live && communityWithoutSub) return 'adopt'
  return 'ignore'
}

/**
 * subscription.deleted downgrades only the subscription we granted.
 * An overflow refund deletes a subscription that was never the member's plan.
 * Matching on stripe_customer_id would drop a VIP or a comp to community.
 */
export function shouldDowngradeOnDelete(opts: {
  storedSubscriptionId: string | null | undefined
  eventSubscriptionId: string
}): boolean {
  return Boolean(opts.storedSubscriptionId) && opts.storedSubscriptionId === opts.eventSubscriptionId
}
