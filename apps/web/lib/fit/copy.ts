/**
 * Evolved Pros Fit copy locks (George go 2026-09-12).
 *
 * VIP $49. Instructional guides. FO55 codes (letter O). HIP MOD chips.
 * 55+ hip-aware. Phone / iPad / laptop + cast to TV.
 * No em dashes. No typed EVOLVED PROS wordmarks.
 */

import { TIERS } from '@/lib/pricing'

export const FIT_VIP_MONTHLY = TIERS.vip.monthly
export const FIT_VIP_PILL = `VIP $${FIT_VIP_MONTHLY}`
export const FIT_UNLOCKS_LINE = `Unlocks at VIP $${FIT_VIP_MONTHLY}`
export const FIT_UPGRADE_CTA = 'Upgrade to VIP'
export const FIT_NEXT_LABEL = 'Next'

export const FIT_PAGE_TITLE = 'Evolved Pros Fit'
export const FIT_PAGE_DESCRIPTION =
  'Instructional video guides for 55+ hip-aware training. One move at a time. Full programs unlock at VIP.'

export const FIT_EYEBROW = 'Instructional guide'
export const FIT_GUIDES_EYEBROW = 'Instructional guides'
export const FIT_ARCHITECTURE_KICKER = 'Architecture'
export const FIT_ARCHITECTURE_LINE = 'Structure first.'

export const FIT_HERO_TITLE = 'Strength that meets you where you are.'
export const FIT_HERO_BODY =
  'One move at a time, filmed, plainly explained, with a modification noted when a joint asks for one.'

export const FIT_BUILT_FOR_TITLE = 'Built for real people'
export const FIT_HIP_MOD_LABEL = 'HIP MOD'
export const FIT_HIP_MOD_DEK = 'Hip-aware progressions'
export const FIT_WATCH_ANYWHERE_TITLE = 'Watch anywhere'
export const FIT_WATCH_ANYWHERE_DEK = 'Phone, iPad, or cast to TV'

export const FIT_FEATURED_EYEBROW = 'Featured guide'
export const FIT_TEASE_DEK = 'One move from the Fit library. Full programs unlock at VIP.'
export const FIT_LOCKED_BAR = 'Deeper detail locked'
export const FIT_PHONE_FOOT = 'Built for phone workouts'

export const FIT_HOW_TITLE = 'How VIP Fit works'
export const FIT_HOW_STEPS = [
  {
    n: '01',
    title: 'Watch on your phone',
    body: 'Propped against a wall. Large type, large controls.',
  },
  {
    n: '02',
    title: 'Cast to TV',
    body: 'Send the same guide to a larger screen when you are in a room.',
  },
  {
    n: '03',
    title: 'Follow the guide',
    body: 'Code, focus, reps, and the modification are named before you start moving.',
  },
] as const

export const FIT_CLOSING_TITLE = 'Make every rep more informed'

export const FIT_LIBRARY_TITLE = 'Fit library'
export const FIT_LIBRARY_DEK = 'Published instructional guides. Hip-aware, 55+ first.'
export const FIT_LIBRARY_EMPTY = 'No published guides yet.'

export const FIT_ADMIN_TITLE = 'Pros Fit'
export const FIT_ADMIN_DEK = 'Fit library for 55+ hip-aware'
export const FIT_ADMIN_EYEBROW = 'Products'
export const FIT_ADMIN_SYNC = 'Sync library'
export const FIT_ADMIN_NEW = 'New move'
export const FIT_ADMIN_MOVES_LABEL = 'Move library'
export const FIT_ADMIN_PUBLISHED_HINT = 'Live to members in the Fit library'
export const FIT_ADMIN_PILOT_HINT = 'Not in the public library yet'
export const FIT_ADMIN_DRAFT_HINT = 'Not published'

export const FIT_FOOTER_LINKS = [
  { label: 'Guides', href: '/fit' },
  { label: 'Membership', href: '/pricing?from=fit&tier=vip' },
  { label: 'Community', href: '/login?mode=signup' },
  { label: 'Contact', href: '/contact' },
] as const

export function fitCopyStrings(): string[] {
  return [
    FIT_VIP_PILL,
    FIT_UNLOCKS_LINE,
    FIT_UPGRADE_CTA,
    FIT_NEXT_LABEL,
    FIT_PAGE_TITLE,
    FIT_PAGE_DESCRIPTION,
    FIT_EYEBROW,
    FIT_GUIDES_EYEBROW,
    FIT_ARCHITECTURE_KICKER,
    FIT_ARCHITECTURE_LINE,
    FIT_HERO_TITLE,
    FIT_HERO_BODY,
    FIT_BUILT_FOR_TITLE,
    FIT_HIP_MOD_LABEL,
    FIT_HIP_MOD_DEK,
    FIT_WATCH_ANYWHERE_TITLE,
    FIT_WATCH_ANYWHERE_DEK,
    FIT_FEATURED_EYEBROW,
    FIT_TEASE_DEK,
    FIT_LOCKED_BAR,
    FIT_PHONE_FOOT,
    FIT_HOW_TITLE,
    FIT_CLOSING_TITLE,
    FIT_LIBRARY_TITLE,
    FIT_LIBRARY_DEK,
    FIT_LIBRARY_EMPTY,
    FIT_ADMIN_TITLE,
    FIT_ADMIN_DEK,
    FIT_ADMIN_EYEBROW,
    FIT_ADMIN_SYNC,
    FIT_ADMIN_NEW,
    FIT_ADMIN_MOVES_LABEL,
    FIT_ADMIN_PUBLISHED_HINT,
    FIT_ADMIN_PILOT_HINT,
    FIT_ADMIN_DRAFT_HINT,
    ...FIT_HOW_STEPS.flatMap(s => [s.n, s.title, s.body]),
    ...FIT_FOOTER_LINKS.map(l => l.label),
  ]
}
