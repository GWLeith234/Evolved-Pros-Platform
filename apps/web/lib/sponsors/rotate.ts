/**
 * Sponsor rotation + dedupe helpers.
 * Used by home, community rail, academy, live, and client-side ad hooks
 * so the same partner is not shown twice on one surface, and order
 * rotates across visits/sessions.
 */

import type { SponsorAd } from '@/components/home/HomeSponsorAd'

/** Stable identity key for dedupe (id preferred, then sponsor name). */
export function sponsorKey(ad: Pick<SponsorAd, 'id' | 'sponsor_name' | 'tool_name'>): string {
  if (ad.id) return ad.id
  return `${ad.sponsor_name ?? ''}|${ad.tool_name ?? ''}`.toLowerCase().trim()
}

/** Remove duplicates by id / sponsor name (first occurrence wins). */
export function dedupeSponsors(list: SponsorAd[]): SponsorAd[] {
  const seen = new Set<string>()
  const out: SponsorAd[] = []
  for (const ad of list) {
    const k = sponsorKey(ad)
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(ad)
  }
  return out
}

/** Fisher–Yates shuffle (pure; does not mutate input). */
export function shuffleSponsors(list: SponsorAd[], seed?: number): SponsorAd[] {
  const arr = [...list]
  let s =
    typeof seed === 'number' && Number.isFinite(seed)
      ? seed
      : Math.floor(Math.random() * 1_000_000)
  // Simple LCG for deterministic daily rotation when seed is provided
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Day-of-year seed so server and first paint share a stable daily rotation. */
export function dailySeed(extra = 0): number {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 0))
  const day = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
  return day * 997 + extra
}

/**
 * Pick up to `count` unique sponsors, excluding any keys in `exclude`,
 * with daily-rotated order.
 */
export function pickRotatedSponsors(
  list: SponsorAd[],
  count: number,
  options?: {
    exclude?: Iterable<string>
    /** Extra salt for the daily seed (e.g. placement name hash). */
    salt?: number
    /** If true, fully random each call (client-only rotation). */
    random?: boolean
  },
): SponsorAd[] {
  const exclude = new Set(options?.exclude ?? [])
  const pool = dedupeSponsors(list).filter(a => !exclude.has(sponsorKey(a)))
  if (pool.length === 0 || count <= 0) return []
  const ordered = options?.random
    ? shuffleSponsors(pool)
    : shuffleSponsors(pool, dailySeed(options?.salt ?? 0))
  return ordered.slice(0, Math.min(count, ordered.length))
}

/** Rotate index through a list (client interval helpers). */
export function nextSponsorIndex(current: number, length: number): number {
  if (length <= 0) return 0
  return (current + 1) % length
}
