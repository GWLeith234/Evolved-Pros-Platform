/**
 * Admin sidebar IA. George lock 2026-09-11: Kajabi-style groups.
 * Route paths are unchanged (pipeline stays /admin/pipeline; CRM stays /admin/crm).
 */

export interface AdminNavItem {
  label: string
  href: string
  match: RegExp
}

export interface AdminNavSection {
  title: string
  items: AdminNavItem[]
}

/** Standalone Home row, then grouped sections. */
export const ADMIN_NAV_HOME: AdminNavItem = {
  label: 'Home',
  href: '/admin',
  match: /^\/admin$/,
}

export const ADMIN_NAV_SECTIONS: readonly AdminNavSection[] = [
  {
    title: 'People',
    items: [
      { label: 'Members', href: '/admin/members', match: /^\/admin\/members/ },
      { label: 'Member upgrades', href: '/admin/pipeline', match: /^\/admin\/pipeline/ },
      { label: 'Friends', href: '/admin/friends', match: /^\/admin\/friends/ },
      { label: 'Thank-you Community', href: '/admin/thanks', match: /^\/admin\/thanks/ },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Prospects CRM', href: '/admin/crm', match: /^\/admin\/crm/ },
      { label: 'Products', href: '/admin/products', match: /^\/admin\/products/ },
      { label: 'Revenue', href: '/admin/revenue', match: /^\/admin\/revenue/ },
      { label: 'Partners', href: '/admin/partners', match: /^\/admin\/partners/ },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Broadcast', href: '/admin/broadcast', match: /^\/admin\/broadcast/ },
      { label: 'Ads', href: '/admin/ads', match: /^\/admin\/ads/ },
      { label: 'Polls', href: '/admin/polls', match: /^\/admin\/polls/ },
    ],
  },
  {
    title: 'Products',
    items: [
      { label: 'Courses', href: '/admin/courses', match: /^\/admin\/courses/ },
      { label: 'Episodes', href: '/admin/episodes', match: /^\/admin\/episodes/ },
      { label: 'Events', href: '/admin/events', match: /^\/admin\/events/ },
      { label: 'Speaking', href: '/admin/speaking', match: /^\/admin\/speaking/ },
      { label: 'Media', href: '/admin/media', match: /^\/admin\/media/ },
      { label: 'Careers', href: '/admin/careers', match: /^\/admin\/careers/ },
    ],
  },
  {
    title: 'Website',
    items: [
      { label: 'Branding', href: '/admin/branding', match: /^\/admin\/branding/ },
    ],
  },
]

export function flattenAdminNav(): AdminNavItem[] {
  return [ADMIN_NAV_HOME, ...ADMIN_NAV_SECTIONS.flatMap(s => s.items)]
}
