'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarItem {
  label: string
  href: string
  match: RegExp
}

interface SidebarSectionData {
  title: string
  items: SidebarItem[]
}

const SECTIONS: ReadonlyArray<SidebarSectionData> = [
  {
    title: 'Admin',
    items: [
      { label: 'Dashboard',   href: '/admin',          match: /^\/admin$/ },
      { label: 'All Members', href: '/admin/members',  match: /^\/admin\/members/ },
      { label: 'Revenue',     href: '/admin/revenue',  match: /^\/admin\/revenue/ },
      { label: 'Prospects CRM', href: '/admin/crm',    match: /^\/admin\/crm/ },
      { label: 'Products',    href: '/admin/products', match: /^\/admin\/products/ },
      { label: 'Pipeline',    href: '/admin/pipeline', match: /^\/admin\/pipeline/ },
      { label: 'Broadcast',   href: '/admin/broadcast', match: /^\/admin\/broadcast/ },
    ],
  },
  {
    title: 'Beta',
    items: [
      { label: 'Friends of George', href: '/admin/friends', match: /^\/admin\/friends/ },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Courses',   href: '/admin/courses',   match: /^\/admin\/courses/ },
      { label: 'Episodes',  href: '/admin/episodes',  match: /^\/admin\/episodes/ },
      { label: 'Events',    href: '/admin/events',    match: /^\/admin\/events/ },
      { label: 'Speaking',  href: '/admin/speaking',  match: /^\/admin\/speaking/ },
      { label: 'Media',     href: '/admin/media',     match: /^\/admin\/media/ },
      { label: 'Careers',   href: '/admin/careers',   match: /^\/admin\/careers/ },
      { label: 'Polls',     href: '/admin/polls',     match: /^\/admin\/polls/ },
      { label: 'Ads',       href: '/admin/ads',       match: /^\/admin\/ads/ },
      { label: 'Partners',  href: '/admin/partners',  match: /^\/admin\/partners/ },
      { label: 'Branding',  href: '/admin/branding',  match: /^\/admin\/branding/ },
    ],
  },
]

function SidebarSection({ title, items, onSelect }: { title: string; items: SidebarItem[]; onSelect?: () => void }) {
  const pathname = usePathname()
  return (
    <div className="mb-5">
      <p
        className="px-5 mb-1 font-condensed font-bold uppercase tracking-[0.2em] text-[12px]"
        style={{ color: 'rgba(255,255,255,0.25)' }}
      >
        {title}
      </p>
      {items.map(item => {
        const active = item.match.test(pathname)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onSelect}
            className="flex items-center px-5 py-[9px] font-condensed font-semibold uppercase tracking-[0.12em] text-[12px] transition-all duration-150"
            style={{
              color: active ? '#68a2b9' : 'rgba(255,255,255,0.5)',
              backgroundColor: active ? 'rgba(255,255,255,0.06)' : 'transparent',
              borderLeft: active ? '2px solid #68a2b9' : '2px solid transparent',
              paddingLeft: active ? '18px' : '20px',
            }}
            onMouseEnter={e => {
              if (!active) {
                const el = e.currentTarget as HTMLElement
                el.style.backgroundColor = 'rgba(255,255,255,0.04)'
                el.style.color = 'rgba(255,255,255,0.8)'
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                const el = e.currentTarget as HTMLElement
                el.style.backgroundColor = 'transparent'
                el.style.color = 'rgba(255,255,255,0.5)'
              }
            }}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

/** Renders just the navigation sections — used by both the desktop aside
 *  and the mobile drawer in AdminTopNav. */
export function AdminSidebarNav({ onSelect }: { onSelect?: () => void }) {
  return (
    <>
      {SECTIONS.map(section => (
        <SidebarSection key={section.title} title={section.title} items={section.items} onSelect={onSelect} />
      ))}
      <div className="mt-auto px-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          href="/home"
          onClick={onSelect}
          className="font-condensed text-[12px] tracking-wide transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          ← Back to Platform
        </Link>
      </div>
    </>
  )
}

export function AdminSidebar() {
  return (
    <aside
      className="hidden md:flex w-[200px] flex-shrink-0 flex-col py-5"
      style={{ backgroundColor: '#0d1c27', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      <AdminSidebarNav />
    </aside>
  )
}
