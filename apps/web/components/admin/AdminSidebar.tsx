'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarItem {
  label: string
  href: string
  match: RegExp
}

function SidebarSection({ title, items }: { title: string; items: SidebarItem[] }) {
  const pathname = usePathname()
  return (
    <div className="mb-5">
      <p
        className="px-5 mb-1 font-condensed font-bold uppercase tracking-[0.2em] text-[9px]"
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

export function AdminSidebar() {
  return (
    <aside
      className="w-[200px] flex-shrink-0 flex flex-col py-5"
      style={{ backgroundColor: '#0d1c27', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      <SidebarSection
        title="Admin"
        items={[
          { label: 'Dashboard',    href: '/admin',         match: /^\/admin$/ },
          { label: 'All Members',  href: '/admin/members', match: /^\/admin\/members/ },
          { label: 'Revenue',      href: '/admin/revenue', match: /^\/admin\/revenue/ },
          { label: 'Pipeline',     href: '/admin/pipeline',match: /^\/admin\/pipeline/ },
          { label: 'Broadcast',    href: '/admin/broadcast', match: /^\/admin\/broadcast/ },
        ]}
      />
      <SidebarSection
        title="Vendasta CRM"
        items={[
          { label: 'Contacts',      href: 'https://business.vendasta.com/crm/contacts',     match: /^$/ },
          { label: 'Opportunities', href: 'https://business.vendasta.com/crm/opportunities', match: /^$/ },
        ]}
      />
      <SidebarSection
        title="Content"
        items={[
          { label: 'Courses',   href: '/admin/courses',   match: /^\/admin\/courses/ },
          { label: 'Events',    href: '/admin/events',    match: /^\/admin\/events/ },
          { label: 'Branding',  href: '/admin/branding',  match: /^\/admin\/branding/ },
        ]}
      />

      <div className="mt-auto px-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          href="/home"
          className="font-condensed text-[11px] tracking-wide transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          ← Back to Platform
        </Link>
      </div>
    </aside>
  )
}
