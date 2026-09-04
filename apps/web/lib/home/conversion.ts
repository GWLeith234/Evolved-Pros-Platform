/**
 * Conversion homepage locks (George 2026-09-03, PO packet 2026-09-04).
 *
 * `/` is conversion-only. Copy, hrefs, and the ladder live here so vitest
 * (lib/** only) can pin them. Do not invent member counts, reviews, LIVE
 * dates, or Academy preview. Do not point Join free at /join (308) or only
 * at /pricing.
 *
 * DEPENDENCY-LIGHT: pricing constants + the book dest. No next, no supabase.
 */

import { BOOK_PREORDER_PATH } from '@/lib/book/preorder'
import { TIERS } from '@/lib/pricing'
import { formatDate, formatDuration } from '@/lib/format'

export const JOIN_FREE_HREF = '/login?mode=signup' as const
export const SEE_PRICING_HREF = '/pricing' as const
export const HOME_PATH = '/' as const

/** Public still. Not under /home: middleware treats /home/* as the member app. */
export const HERO_IMAGE_SRC = '/brand/hero-evolved-architecture.png' as const
export const HERO_IMAGE_ALT = 'The Evolved Architecture' as const
export const HOME_ARIA = 'Evolved Pros home' as const

export const HOME_TITLE =
  'Evolved Pros | The daily operating system for sales professionals'
export const HOME_H1 = 'The daily operating system for sales professionals.'
export const HOME_SUB =
  'Everything but the curriculum is free. The Academy is what you upgrade for.'
export const HOME_PRIMARY_CTA = 'Join free. Full community, no card'
export const HOME_SECONDARY_CTA = 'See pricing'
export const HOME_LADDER_LINE =
  'Start free. Upgrade when the Academy is the next step.'
export const HOME_LADDER_SUB =
  'Community is free forever. Step 2 and step 3 are there when you are ready.'

export const HOME_NAV_LINKS = [
  { label: 'Podcast', href: '/podcast' },
  { label: 'Media', href: '/media' },
  { label: 'Academy', href: '/academy' },
  { label: 'LIVE', href: '/live', live: true },
] as const

export type HomeLadderCtaTone = 'primary' | 'ghost'

export interface HomeLadderCard {
  step: string
  name: string
  price: string
  tagline: string
  body: string
  cta: string
  href: string
  tone: HomeLadderCtaTone
  /** Community is the free door. Paid rungs must not steal the hero. */
  featured: boolean
}

export const HOME_LADDER: readonly HomeLadderCard[] = [
  {
    step: '01',
    name: 'Community',
    price: 'FREE',
    tagline: 'Join the room.',
    body: 'Includes Podcast, Media, LIVE and Pillar 1 Foundation. Free forever, no card.',
    cta: 'Join free',
    href: JOIN_FREE_HREF,
    tone: 'primary',
    featured: true,
  },
  {
    step: '02',
    name: 'VIP',
    price: `$${TIERS.vip.monthly} / mo`,
    tagline: 'Work on the inner game.',
    body: 'You are already in the room. This is the step you take on yourself. Identity, toughness and the members\' room where the honest conversations happen.',
    cta: 'Upgrade',
    href: SEE_PRICING_HREF,
    tone: 'ghost',
    featured: false,
  },
  {
    step: '03',
    name: 'Professional',
    price: `$${TIERS.professional.monthly} / mo`,
    tagline: 'The weekly mastermind.',
    body: 'Every week you bring a live deal and the room pressure-tests it. All six pillars come with it.',
    cta: 'Join the weekly mastermind',
    href: SEE_PRICING_HREF,
    tone: 'ghost',
    featured: false,
  },
]

export const HOME_BOOK = {
  kicker: 'The book',
  title: 'EVOLVED',
  release: 'Out 15 Sep.',
  cta: 'Pre-order',
  href: BOOK_PREORDER_PATH,
} as const

export const HOME_EPISODES_TITLE = 'Latest episodes'
export const HOME_EPISODES_LINK = 'All episodes'
export const HOME_SIGN_IN = 'Sign in'
export const HOME_JOIN_FREE = 'Join free'
export const HOME_OPEN_PLATFORM = 'Open the platform'
export const HOME_OPEN_PLATFORM_HREF = '/home'

/** U+2014. Homepage title, meta, copy, and aria must never contain it. */
export const EM_DASH = '\u2014'

export function conversionCopyStrings(): string[] {
  return [
    HOME_TITLE,
    HOME_H1,
    HOME_SUB,
    HOME_PRIMARY_CTA,
    HOME_SECONDARY_CTA,
    HOME_LADDER_LINE,
    HOME_LADDER_SUB,
    HOME_ARIA,
    HERO_IMAGE_ALT,
    HOME_EPISODES_TITLE,
    HOME_EPISODES_LINK,
    HOME_SIGN_IN,
    HOME_JOIN_FREE,
    HOME_OPEN_PLATFORM,
    HOME_BOOK.kicker,
    HOME_BOOK.title,
    HOME_BOOK.release,
    HOME_BOOK.cta,
    ...HOME_NAV_LINKS.map(l => l.label),
    ...HOME_LADDER.flatMap(card => [
      card.step,
      card.name,
      card.price,
      card.tagline,
      card.body,
      card.cta,
    ]),
  ]
}

export function hasEmDash(value: string): boolean {
  return value.includes(EM_DASH)
}

export function homeEpisodeKicker(episodeNumber: number | null | undefined): string {
  if (episodeNumber == null) return 'EPISODE'
  return `EP ${String(episodeNumber).padStart(3, '0')}`
}

/** Date + duration for episode cards. Middle dot, never an em dash. */
export function homeEpisodeMeta(
  publishedAt: string | null | undefined,
  durationSeconds: number | null | undefined,
): string {
  const date = publishedAt ? formatDate(publishedAt, 'stamp') : ''
  const mins =
    durationSeconds != null && durationSeconds > 0
      ? formatDuration(Math.round(durationSeconds / 60))
      : null
  const duration = mins ? mins.toUpperCase() : ''
  return [date, duration].filter(Boolean).join(' \u00b7 ')
}

export function youtubeStillUrl(youtubeId: string | null | undefined): string | null {
  if (!youtubeId) return null
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
}
