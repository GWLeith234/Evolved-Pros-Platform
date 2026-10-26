/**
 * Public footer link model (SPRINT FOOTER-1).
 *
 * Extracted from components/layout/PublicFooter.tsx for the same reason as
 * lib/seo/publicRoutes.ts: vitest only collects lib/** (see vitest.config.ts),
 * so nothing under app/ or components/ can be covered. The label/href contract
 * is the part worth a regression test — a footer that silently loses /terms or
 * /privacy is exactly the hole the Sprint 0 crawl found.
 *
 * DEPENDENCY-FREE ON PURPOSE — imports nothing. No next, no supabase.
 */

export interface PublicFooterLink {
  /** Exact visible label. Copy is fixed; do not "improve" it here. */
  label: string
  href: string
  /**
   * The single red CTA. STYLEGUIDE / FOOTER-1: at most ONE red CTA in the
   * footer — everything else is a ghost link.
   */
  cta?: true
}

/**
 * Footer navigation, in render order.
 *
 * Join free used to href /join, which 308s to /login?mode=signup — a thin
 * auth form, not a sell page. The spoken /join URL still 308s (next.config);
 * public chrome now lands on live /pricing instead. The Community card on
 * /pricing keeps /login?mode=signup. Do not point this CTA at /join.
 */
export const PUBLIC_FOOTER_LINKS: readonly PublicFooterLink[] = [
  { label: 'Join free', href: '/pricing', cta: true },
  { label: 'Pricing',   href: '/pricing' },
  { label: 'Podcast',   href: '/podcast' },
  { label: 'Media',     href: '/media' },
  { label: 'Fit',       href: '/fit' },
  { label: 'LIVE',      href: '/live' },
  // Utility cluster. About is not a primary-nav item.
  { label: 'About',     href: '/about' },
  { label: 'Contact',   href: '/contact' },
  { label: 'Privacy',   href: '/privacy' },
  { label: 'Terms',     href: '/terms' },
]

/**
 * The contracting entity. Evolved Pros is the brand; this is the company.
 * Not Evolved Publishing, not EvolveX360.
 */
export const FOOTER_LEGAL_ENTITY = 'GWLeith Revenue Growth Solutions'

/** Support + keynote inboxes surfaced on /contact and in the legal pages. */
export const SUPPORT_EMAIL = 'support@evolvedpros.com'
export const SPEAKING_EMAIL = 'speaking@evolvedpros.com'

/** `© 2026 GWLeith Revenue Growth Solutions` — year injected so it is testable. */
export function footerCopyright(year: number = new Date().getFullYear()): string {
  return `© ${year} ${FOOTER_LEGAL_ENTITY}`
}

export type ListenOnMark = 'apple' | 'spotify' | 'youtube' | 'text'

export interface ListenOnLink {
  /** Visible label for text links. Badge links keep the platform name for tests. */
  label: string
  href: string
  /** Accessible name. The row label is "Listen on"; each anchor names its platform. */
  ariaLabel: string
  /**
   * apple, spotify, and youtube render official marks. Artwork sources live
   * next to those images in components/layout/PublicFooter.tsx.
   * text is a word link (no official badge is used).
   */
  mark: ListenOnMark
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
    mark: 'apple',
  },
  {
    label: 'Spotify',
    href: 'https://open.spotify.com/show/1KZoT8k38tBfq242pKUdg9',
    ariaLabel: 'Listen on Spotify',
    mark: 'spotify',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@evolvedpros/podcasts',
    ariaLabel: 'Listen on YouTube',
    mark: 'youtube',
  },
  {
    label: 'Pocket Casts',
    href: 'https://pocketcasts.com/podcast/evolved-pros-podcast/cc1e4a60-310b-013f-9952-0afff26cbb09',
    ariaLabel: 'Listen on Pocket Casts',
    mark: 'text',
  },
  {
    label: 'Castbox',
    href: 'https://castbox.fm/channel/id7226086',
    ariaLabel: 'Listen on Castbox',
    mark: 'text',
  },
  {
    label: 'Podcast Addict',
    href: 'https://podcastaddict.com/podcast/evolved-pros-podcast/7329000',
    ariaLabel: 'Listen on Podcast Addict',
    mark: 'text',
  },
  {
    label: 'Podchaser',
    href: 'https://www.podchaser.com/podcasts/evolved-pros-podcast-6476083',
    ariaLabel: 'Listen on Podchaser',
    mark: 'text',
  },
  {
    label: 'Podcast Index',
    href: 'https://podcastindex.org/podcast/7854130',
    ariaLabel: 'Listen on Podcast Index',
    mark: 'text',
  },
  {
    label: 'RSS',
    href: 'https://anchor.fm/s/111ea3a3c/podcast/rss',
    ariaLabel: 'Listen on RSS',
    mark: 'text',
  },
]
