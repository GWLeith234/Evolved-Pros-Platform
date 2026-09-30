/**
 * PLACEHOLDER discounts on a paid LIVE event ticket.
 *
 * George changes these without a code edit. Set the env vars on Railway:
 *   LIVE_DISCOUNT_PCT_COMMUNITY   default 0
 *   LIVE_DISCOUNT_PCT_VIP         default 10
 *   LIVE_DISCOUNT_PCT_PRO         default 20
 *
 * Whole percents, 0 to 100. A blank or invalid value keeps the default.
 * Logged-out buyers are always 0, even if the community value changes.
 * This module does not read a request body, a client tier, or a client percent.
 */

export const LIVE_DISCOUNT_PCT_DEFAULTS = {
  community: 0,
  vip: 10,
  pro: 20,
} as const

export type LiveDiscountTier = keyof typeof LIVE_DISCOUNT_PCT_DEFAULTS

const LIVE_DISCOUNT_PCT_ENV: Record<LiveDiscountTier, string> = {
  community: 'LIVE_DISCOUNT_PCT_COMMUNITY',
  vip: 'LIVE_DISCOUNT_PCT_VIP',
  pro: 'LIVE_DISCOUNT_PCT_PRO',
}

function readPercent(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw == null || raw.trim() === '') return fallback
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(100, Math.max(0, Math.round(parsed)))
}

/** Active tier key, or null when there is no signed-in buyer. */
export function liveDiscountTier(tier: string | null | undefined): LiveDiscountTier | null {
  const key = (tier ?? '').trim().toLowerCase()
  if (key === 'pro' || key === 'professional') return 'pro'
  if (key === 'vip') return 'vip'
  if (key === 'community') return 'community'
  return null
}

/**
 * PLACEHOLDER percent for this tier. Null (logged out, or an unknown tier)
 * is 0. Community reads LIVE_DISCOUNT_PCT_COMMUNITY, whose default is 0.
 */
export function liveDiscountPercent(tier: string | null | undefined): number {
  const key = liveDiscountTier(tier)
  if (!key) return 0
  return readPercent(LIVE_DISCOUNT_PCT_ENV[key], LIVE_DISCOUNT_PCT_DEFAULTS[key])
}

/** List price in cents, after the member percent. Rounded to a whole cent. */
export function discountedTicketCents(listCents: number, percent: number): number {
  const list = Math.round(listCents)
  if (!Number.isFinite(list) || list <= 0) return 0
  const pct = Math.min(100, Math.max(0, Math.round(percent)))
  if (pct <= 0) return list
  return Math.round((list * (100 - pct)) / 100)
}
