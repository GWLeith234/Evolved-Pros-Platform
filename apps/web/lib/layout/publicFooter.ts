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
 * /join does not exist yet — SPRINT DOORS-1 adds the redirect. The link ships
 * now on purpose so the two PRs can land in order.
 */
export const PUBLIC_FOOTER_LINKS: readonly PublicFooterLink[] = [
  { label: 'Join free', href: '/join', cta: true },
  { label: 'Pricing',   href: '/pricing' },
  { label: 'Podcast',   href: '/podcast' },
  { label: 'Media',     href: '/media' },
  { label: 'LIVE',      href: '/live' },
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
