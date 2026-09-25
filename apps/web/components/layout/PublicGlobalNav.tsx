import Link from 'next/link'
import { GlobalNavList } from '@/components/layout/GlobalNavList'
import { GLOBAL_NAV_CTA, GLOBAL_NAV_LINKS, isGlobalNavCurrent } from '@/lib/layout/globalNav'

/**
 * Persistent global nav for the public sections (SPRINT M).
 *
 * /media, /fit and /live drop the member shell by design - each has its own
 * masthead and its own palette - but dropping the shell also dropped every way
 * out except "Back to platform". This rail restores the seven destinations
 * above each section's own chrome, so no public section is a dead end.
 *
 * Server component with no session read: see lib/layout/globalNav.ts for why.
 * `current` is passed in rather than read from usePathname so this stays out of
 * the client bundle - the sections are static routes and each knows its own.
 * GlobalNavList is the client island that scrolls the active tab into view.
 */
export function PublicGlobalNav({
  /** The section this rail is mounted in, e.g. '/media'. */
  current,
  /**
   * 'dark' pins the rail to the dark token set for the always-dark shells
   * (/live). 'theme' follows the light/dark toggle like the rest of the app.
   */
  tone = 'theme',
}: {
  current?: string
  tone?: 'theme' | 'dark'
}) {
  return (
    <nav
      aria-label="Evolved Pros"
      className={`ep-global-nav${tone === 'dark' ? ' ep-force-dark' : ''}`}
      data-global-nav={current ?? ''}
    >
      <div className="ep-global-nav-inner">
        <GlobalNavList>
          {GLOBAL_NAV_LINKS.map(link => {
            const isCurrent = current
              ? isGlobalNavCurrent(link.href, current)
              : false
            return (
              <li key={link.href}>
                <Link href={link.href} aria-current={isCurrent ? 'page' : undefined}>
                  {link.label}
                </Link>
              </li>
            )
          })}
        </GlobalNavList>
        <Link href={GLOBAL_NAV_CTA.href} className="ep-global-nav-cta">
          {GLOBAL_NAV_CTA.label}
        </Link>
      </div>
    </nav>
  )
}
