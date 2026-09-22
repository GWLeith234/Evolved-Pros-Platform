/**
 * End-of-article CTA model (SPRINT M).
 *
 * Media articles ended in a related-stories rail and nothing else: a reader who
 * arrived from search finished the piece with no door into the platform. This
 * is that door, in three states.
 *
 * DELIBERATELY THIN. Sprint L owns lib/entitlements.ts and the real tier
 * matrix; this maps one already-resolved viewer state to one block of copy so
 * that swapping it for the matrix later is a one-function change, not an
 * archaeology exercise. No tier strings are compared here - the caller hands us
 * the state, resolved through the existing hasTierAccess()/effectiveTier()
 * helpers, and nothing in this file knows what 'vip' means.
 *
 * DEPENDENCY-FREE ON PURPOSE - imports nothing.
 */

/**
 * - `anon`   - no session. Sell the free door.
 * - `free`   - signed in, not on a paid tier. Sell the upgrade.
 * - `member` - signed in and paying. Sell nothing; they already bought it.
 */
export type ArticleCtaState = 'anon' | 'free' | 'member'

export interface ArticleCtaCopy {
  kicker: string
  headline: string
  body: string
  primary: { label: string; href: string }
  secondary?: { label: string; href: string }
}

const COPY: Record<Exclude<ArticleCtaState, 'member'>, ArticleCtaCopy> = {
  anon: {
    kicker: 'Community',
    headline: 'Start free. VIP is there when you want more.',
    body:
      'Join the Community with no card. VIP is $99 when you want Fit and Academy depth. Media stays open.',
    primary: { label: 'Join free', href: '/pricing' },
    secondary: { label: 'See VIP', href: '/pricing' },
  },
  free: {
    kicker: 'Go deeper',
    headline: 'You are in the Community. VIP is the next room.',
    body:
      'VIP opens Fit programming and the full Academy, across all six pillars. $99, cancel whenever.',
    primary: { label: 'Upgrade to VIP', href: '/pricing' },
    secondary: { label: 'Back to the platform', href: '/home' },
  },
}

/** The block to render, or null when the viewer is already a paying member. */
export function articleCtaCopy(state: ArticleCtaState): ArticleCtaCopy | null {
  return state === 'member' ? null : COPY[state]
}

/** Narrows an untrusted value (an API response) to a state. */
export function toArticleCtaState(raw: unknown): ArticleCtaState {
  return raw === 'free' || raw === 'member' ? raw : 'anon'
}
