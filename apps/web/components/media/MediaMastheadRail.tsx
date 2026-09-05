'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MEDIA_INDEX_SECTIONS } from '@/lib/media/desk'

function isCurrent(pathname: string, href: string): boolean {
  if (href === '/media') return pathname === '/media'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MediaMastheadRail() {
  const pathname = usePathname()

  return (
    <nav aria-label="Media sections" className="ep-media-masthead-rail">
      {MEDIA_INDEX_SECTIONS.map(section => {
        const current = isCurrent(pathname, section.href)
        return (
          <Link
            key={section.id}
            href={section.href}
            aria-current={current ? 'page' : undefined}
          >
            {section.label}
          </Link>
        )
      })}
    </nav>
  )
}
