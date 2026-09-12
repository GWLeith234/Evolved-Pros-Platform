'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ADMIN_NAV_HOME,
  ADMIN_NAV_SECTIONS,
  type AdminNavItem,
  type AdminNavSection,
} from '@/lib/admin/nav'

const LINK_BASE =
  'flex items-center min-h-[44px] px-4 font-body text-[14px] leading-snug transition-colors duration-150'

function navLinkStyle(active: boolean): CSSProperties {
  return {
    color: active ? '#112535' : '#1b3c5a',
    backgroundColor: active ? 'rgba(17,37,53,0.07)' : 'transparent',
    borderLeft: active ? '2px solid #ef0e30' : '2px solid transparent',
    fontWeight: active ? 600 : 500,
    textDecoration: 'none',
  }
}

function NavLink({ item, onSelect }: { item: AdminNavItem; onSelect?: () => void }) {
  const pathname = usePathname()
  const active = item.match.test(pathname)
  return (
    <Link
      href={item.href}
      onClick={onSelect}
      className={LINK_BASE}
      style={navLinkStyle(active)}
      aria-current={active ? 'page' : undefined}
    >
      {item.label}
    </Link>
  )
}

function SidebarSection({
  section,
  onSelect,
}: {
  section: AdminNavSection
  onSelect?: () => void
}) {
  return (
    <div className="mb-4">
      <p
        className="px-4 mb-1 font-condensed font-bold uppercase tracking-[0.16em] text-[11px]"
        style={{ color: '#4a5d6e' }}
      >
        {section.title}
      </p>
      {section.items.map(item => (
        <NavLink key={item.href} item={item} onSelect={onSelect} />
      ))}
    </div>
  )
}

/** Shared nav for the desktop rail and the mobile drawer. */
export function AdminSidebarNav({ onSelect }: { onSelect?: () => void }) {
  return (
    <>
      <div className="mb-3">
        <NavLink item={ADMIN_NAV_HOME} onSelect={onSelect} />
      </div>
      {ADMIN_NAV_SECTIONS.map(section => (
        <SidebarSection key={section.title} section={section} onSelect={onSelect} />
      ))}
      <div className="mt-auto px-4 pt-4" style={{ borderTop: '1px solid rgba(17,37,53,0.10)' }}>
        <Link
          href="/home"
          onClick={onSelect}
          className="inline-flex items-center min-h-[44px] font-body text-[14px]"
          style={{ color: '#4a5d6e', textDecoration: 'none' }}
        >
          Back to platform
        </Link>
      </div>
    </>
  )
}

export function AdminSidebar() {
  return (
    <aside
      className="admin-sidebar hidden md:flex w-[240px] flex-shrink-0 flex-col py-4 overflow-y-auto"
      style={{
        backgroundColor: '#ffffff',
        borderRight: '1px solid rgba(17,37,53,0.10)',
      }}
    >
      <AdminSidebarNav />
    </aside>
  )
}
