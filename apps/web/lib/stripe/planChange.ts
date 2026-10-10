/**
 * Plan changes on an existing Stripe subscription.
 *
 * A VIP who buys The Evolved Pros 99 used to pass alreadyEntitledTo (pro
 * outranks vip) and open a second Checkout Session. The VIP subscription
 * kept billing. This module decides the change, and builds the Stripe
 * update, without calling Stripe.
 */

export const BILLABLE_SUBSCRIPTION_STATUSES = ['active', 'trialing', 'past_due'] as const

export type BillableSubscriptionStatus = (typeof BILLABLE_SUBSCRIPTION_STATUSES)[number]

export function isBillableSubscriptionStatus(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing' || status === 'past_due'
}

export type PlanChangeAction = 'already' | 'update' | 'checkout' | 'refuse-duplicate'

/**
 * What checkout should do.
 *
 *   already           same tier, or a higher grant with no Stripe subscription
 *   update            one billable subscription: change its item, do not
 *                     open a second Checkout Session
 *   checkout          no billable subscription: a new Checkout Session
 *   refuse-duplicate  more than one billable subscription and no stored id
 *                     to update. Creating another would bill a third time.
 */
export function planChangeAction(opts: {
  sameTier: boolean
  entitledAtOrAbove: boolean
  hasBillableSubscription: boolean
  /** Billable subscriptions on the customer, including the stored one. */
  liveSubscriptionCount: number
}): PlanChangeAction {
  if (opts.sameTier) return 'already'
  if (opts.liveSubscriptionCount > 1 && !opts.hasBillableSubscription) return 'refuse-duplicate'
  if (opts.hasBillableSubscription || opts.liveSubscriptionCount === 1) return 'update'
  if (opts.entitledAtOrAbove) return 'already'
  return 'checkout'
}

/**
 * Stripe Subscriptions update payload. proration_behavior is fixed:
 * the unused time on the old price and the new price are invoiced now.
 */
export function subscriptionPriceUpdateParams(opts: {
  itemId: string
  priceId: string
  metadata: Record<string, string>
}): {
  items: Array<{ id: string; price: string }>
  proration_behavior: 'create_prorations'
  metadata: Record<string, string>
} {
  return {
    items: [{ id: opts.itemId, price: opts.priceId }],
    proration_behavior: 'create_prorations',
    metadata: opts.metadata,
  }
}

/**
 * Whether subscription.updated may write users.tier.
 *
 * A second live subscription must not grant a second tier. The stored
 * subscription may still sync a price change (VIP item swapped to The 99).
 * Adopting one of several live subscriptions would pick a winner and hide
 * the duplicate, so that path does not grant.
 */
export function shouldGrantSubscriptionEvent(opts: {
  action: 'sync' | 'adopt' | 'ignore'
  liveBillableCount: number
}): { grant: boolean; duplicate: boolean } {
  const duplicate = opts.liveBillableCount > 1
  if (opts.action === 'sync') return { grant: true, duplicate }
  if (opts.action === 'adopt' && !duplicate) return { grant: true, duplicate: false }
  return { grant: false, duplicate }
}
