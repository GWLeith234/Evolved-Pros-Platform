/**
 * Public footer link model.
 *
 * Extracted from components/layout/PublicFooter.tsx for the same reason as
 * lib/seo/publicRoutes.ts: vitest only collects lib/** (see vitest.config.ts),
 * so nothing under app/ or components/ can be covered. The label/href contract
 * is the part worth a regression test. A footer that silently loses /terms or
 * /privacy is exactly the hole the Sprint 0 crawl found.
 *
 * DEPENDENCY-FREE ON PURPOSE. Imports nothing. No next, no supabase.
 *
 * George-approved layout (2026-10-29): JOIN FREE, then three labelled groups.
 * Listen marks are white icons in matching circles. RSS is the site feed.
 */

export interface PublicFooterLink {
  /** Exact visible label. Copy is fixed; do not "improve" it here. */
  label: string
  href: string
  /**
   * The single red control. Everything else in the footer is a text link.
   * The mockup's 3px top rule uses the same red; it is not a second control.
   */
  cta?: true
}

export interface FooterLinkGroup {
  label: string
  links: readonly PublicFooterLink[]
}

/**
 * Tagline under the wordmark. Approved copy. Do not paraphrase.
 */
export const FOOTER_TAGLINE =
  'Straight talk on revenue, leadership and growth from George Leith.'

/**
 * Join free used to href /join, which 308s to /login?mode=signup, a thin
 * auth form, not a sell page. The spoken /join URL still 308s (next.config);
 * public chrome now lands on live /pricing instead. Do not point this CTA at /join.
 */
export const FOOTER_JOIN_FREE: PublicFooterLink = {
  label: 'JOIN FREE',
  href: '/pricing',
  cta: true,
}

/**
 * Link groups, in render order. Labels match the approved mockup.
 * Live is sentence case here. The top nav keeps its own LIVE label.
 */
export const FOOTER_LINK_GROUPS: readonly FooterLinkGroup[] = [
  {
    label: 'Platform',
    links: [
      { label: 'Pricing', href: '/pricing' },
      { label: 'Podcast', href: '/podcast' },
      { label: 'Media', href: '/media' },
      { label: 'Fit', href: '/fit' },
      { label: 'Live', href: '/live' },
    ],
  },
  {
    label: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
]

/**
 * Flat navigation, in render order. JOIN FREE first, then each group.
 * JSON-LD looks up Contact by href, so that label must stay "Contact".
 */
export const PUBLIC_FOOTER_LINKS: readonly PublicFooterLink[] = [
  FOOTER_JOIN_FREE,
  ...FOOTER_LINK_GROUPS.flatMap(group => group.links),
]

/**
 * The contracting entity. Evolved Pros is the brand; this is the company.
 * Not Evolved Publishing, not EvolveX360.
 */
export const FOOTER_LEGAL_ENTITY = 'GWLeith Revenue Growth Solutions'

/** Support + keynote inboxes surfaced on /contact and in the legal pages. */
export const SUPPORT_EMAIL = 'support@evolvedpros.com'
export const SPEAKING_EMAIL = 'speaking@evolvedpros.com'

/** `© 2026 GWLeith Revenue Growth Solutions`. Year injected so it is testable. */
export function footerCopyright(year: number = new Date().getFullYear()): string {
  return `© ${year} ${FOOTER_LEGAL_ENTITY}`
}

/**
 * Simple Icons filenames under /brand/listen/marks, except podchaser, which
 * is the official podchaser.com icon geometry with the colors stripped to white.
 */
export type ListenOnIcon =
  | 'applepodcasts'
  | 'spotify'
  | 'youtube'
  | 'pocketcasts'
  | 'castbox'
  | 'podcastaddict'
  | 'podchaser'
  | 'podcastindex'
  | 'rss'

export interface ListenOnLink {
  /** Visible label under the circle. */
  label: string
  href: string
  /** Accessible name. The row label is "Listen on"; each anchor names its platform. */
  ariaLabel: string
  /** White mark in public/brand/listen/marks. */
  icon: ListenOnIcon
  /**
   * true opens a new tab. RSS is the on-site feed at /podcast/rss.xml
   * and stays in the same tab.
   */
  external: boolean
}

/**
 * "Listen on" platforms, in render order.
 * Podcast Index sits immediately before RSS. No Player.fm, Amazon, or iHeart.
 */
export const LISTEN_ON_LINKS: readonly ListenOnLink[] = [
  {
    label: 'Apple Podcasts',
    href: 'https://podcasts.apple.com/us/podcast/evolved-pros-podcast/id1895786556',
    ariaLabel: 'Listen on Apple Podcasts',
    icon: 'applepodcasts',
    external: true,
  },
  {
    label: 'Spotify',
    href: 'https://open.spotify.com/show/1KZoT8k38tBfq242pKUdg9',
    ariaLabel: 'Listen on Spotify',
    icon: 'spotify',
    external: true,
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@evolvedpros/podcasts',
    ariaLabel: 'Listen on YouTube',
    icon: 'youtube',
    external: true,
  },
  {
    label: 'Pocket Casts',
    href: 'https://pocketcasts.com/podcast/evolved-pros-podcast/cc1e4a60-310b-013f-9952-0afff26cbb09',
    ariaLabel: 'Listen on Pocket Casts',
    icon: 'pocketcasts',
    external: true,
  },
  {
    label: 'Castbox',
    href: 'https://castbox.fm/channel/id7226086',
    ariaLabel: 'Listen on Castbox',
    icon: 'castbox',
    external: true,
  },
  {
    label: 'Podcast Addict',
    href: 'https://podcastaddict.com/podcast/evolved-pros-podcast/7329000',
    ariaLabel: 'Listen on Podcast Addict',
    icon: 'podcastaddict',
    external: true,
  },
  {
    label: 'Podchaser',
    href: 'https://www.podchaser.com/podcasts/evolved-pros-podcast-6476083',
    ariaLabel: 'Listen on Podchaser',
    icon: 'podchaser',
    external: true,
  },
  {
    label: 'Podcast Index',
    href: 'https://podcastindex.org/podcast/7854130',
    ariaLabel: 'Listen on Podcast Index',
    icon: 'podcastindex',
    external: true,
  },
  {
    label: 'RSS',
    href: '/podcast/rss.xml',
    ariaLabel: 'Listen on RSS',
    icon: 'rss',
    external: false,
  },
]
