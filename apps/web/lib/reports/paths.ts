/**
 * Path rules for the private weekly report PWAs.
 * Pure module: middleware and tests both import it. No filesystem, no auth.
 */

export const REPORT_SLUGS = ['adcellerant', 'evolved-pros', 'evolvex360', 'gwleith-money'] as const

export type ReportSlug = (typeof REPORT_SLUGS)[number]

export const REPORT_APPS: readonly { slug: ReportSlug; name: string }[] = [
  { slug: 'adcellerant', name: 'AdCellerant Weekly' },
  { slug: 'evolved-pros', name: 'Evolved Pros Weekly' },
  { slug: 'evolvex360', name: 'EvolveX360 Weekly' },
  { slug: 'gwleith-money', name: 'GWLeith $ Weekly' },
]

/** Seeded platform user ids. Not secrets. Production reads the table. */
export const REPORT_VIEWER_IDS = [
  '930ce556-0b67-422e-a9fa-ca581db45a18',
  '09c059f1-241b-4a3d-9a43-b793ab3dc9ae',
  'c91b6edf-a655-4737-b6a8-4dcb746089ba',
] as const

export const ICON_FILES = ['icon.svg', 'icon-192.png', 'icon-512.png'] as const
export type IconFile = (typeof ICON_FILES)[number]

export const PRIVATE_NO_STORE: Record<string, string> = {
  'Cache-Control': 'private, no-store',
  Vary: 'Cookie',
  'X-Robots-Tag': 'noindex, nofollow',
}

export type ParsedReport =
  | { kind: 'index' }
  | { kind: 'shell'; slug: ReportSlug; trailingSlash: boolean }
  | { kind: 'manifest'; slug: ReportSlug }
  | { kind: 'worker'; slug: ReportSlug }
  | { kind: 'icon'; slug: ReportSlug; file: IconFile }
  | { kind: 'report'; slug: ReportSlug }
  | { kind: 'unknown' }

export function isReportSlug(value: string): value is ReportSlug {
  return (REPORT_SLUGS as readonly string[]).includes(value)
}

export function isWeeklyReportPath(pathname: string): boolean {
  return pathname === '/admin/reports' || pathname.startsWith('/admin/reports/')
}

export function reportScope(slug: ReportSlug): string {
  return `/admin/reports/${slug}/`
}

/**
 * Development-only stand-in for the private tables. Production ignores the
 * flag even if it is set, so a hosted env change cannot turn on example data.
 */
export function shapeFixtureEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.NODE_ENV !== 'production' && env.WEEKLY_REPORTS_SHAPE_FIXTURE === '1'
}

export function seededViewer(userId: string): boolean {
  return (REPORT_VIEWER_IDS as readonly string[]).includes(userId)
}

/**
 * Next's default slash redirect would pull `/admin/reports/<slug>/` outside
 * the service-worker scope. skipTrailingSlashRedirect is on, and this helper
 * keeps the old canonical (no trailing slash) for every other matched path.
 * The PWA directory URL is the exception.
 */
export function stripTrailingSlashTarget(pathname: string): string | null {
  if (pathname.length <= 1 || !pathname.endsWith('/')) return null
  if (/^\/admin\/reports\/[^/]+\/$/.test(pathname)) return null
  const stripped = pathname.replace(/\/+$/, '')
  return stripped || '/'
}

export function parseReportPath(pathname: string): ParsedReport {
  if (pathname === '/admin/reports' || pathname === '/admin/reports/') {
    return { kind: 'index' }
  }
  const match = pathname.match(/^\/admin\/reports\/([^/]+)\/?(.*)$/)
  if (!match) return { kind: 'unknown' }
  const slug = match[1]
  const rest = match[2]
  if (!isReportSlug(slug)) return { kind: 'unknown' }
  if (rest.includes('..') || rest.includes('\\') || rest.includes('\0')) {
    return { kind: 'unknown' }
  }
  if (rest === '' || rest === 'index.html') {
    return { kind: 'shell', slug, trailingSlash: pathname.endsWith('/') && rest === '' }
  }
  if (rest === 'manifest.webmanifest') return { kind: 'manifest', slug }
  if (rest === 'sw.js') return { kind: 'worker', slug }
  if (rest === 'report.json') return { kind: 'report', slug }
  if ((ICON_FILES as readonly string[]).includes(rest)) {
    return { kind: 'icon', slug, file: rest as IconFile }
  }
  return { kind: 'unknown' }
}

/** Logged-out pages redirect to login. JSON and other assets return 401. */
export function anonymousDisposition(pathname: string): 401 | 'redirect' {
  const parsed = parseReportPath(pathname)
  if (parsed.kind === 'index' || parsed.kind === 'shell') return 'redirect'
  if (parsed.kind === 'unknown') {
    const last = pathname.split('/').pop() ?? ''
    if (!last.includes('.')) return 'redirect'
    return 401
  }
  return 401
}
