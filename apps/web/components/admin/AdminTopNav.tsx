'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { AdminSidebarNav } from './AdminSidebar'

const NAV_TABS = [
  { label: 'Members',      href: '/admin/members',  match: /^\/admin\/members/ },
  { label: 'Revenue',      href: '/admin/revenue',  match: /^\/admin\/revenue/ },
  { label: 'Pipeline',     href: '/admin/pipeline', match: /^\/admin\/pipeline/ },
  { label: 'Vendasta CRM', href: 'https://business.vendasta.com/crm/contacts', match: /^$/ },
]

interface AdminTopNavProps {
  profile: {
    display_name: string | null
    full_name: string | null
  }
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'A'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function AdminTopNav({ profile }: AdminTopNavProps) {
  const pathname = usePathname()
  const displayName = profile.display_name ?? profile.full_name ?? ''
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 h-14 flex-shrink-0"
      style={{
        backgroundColor: '#0d1c27',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo + Admin label */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger — visible only when desktop sidebar is hidden */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open admin navigation"
          aria-expanded={mobileMenuOpen}
          className="md:hidden -ml-1 p-2 rounded"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
        <Link
          href="/admin"
          className="font-condensed font-bold text-white tracking-[0.14em] text-base select-none"
        >
          EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
        </Link>
        <span
          className="hidden sm:inline-block font-condensed font-bold uppercase tracking-[0.18em] text-[12px] px-2 py-0.5 rounded"
          style={{
            color: 'rgba(255,255,255,0.5)',
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          Admin
        </span>
      </div>

      {/* Mobile nav modal — surfaces the same sections as the desktop sidebar
          when the viewport is below md (where AdminSidebar is hidden). */}
      <Modal
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        ariaLabel="Admin navigation"
        maxWidth={320}
        panelStyle={{
          backgroundColor: '#0d1c27',
          color: 'rgba(255,255,255,0.85)',
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
        }}
      >
        <AdminSidebarNav onSelect={() => setMobileMenuOpen(false)} />
      </Modal>

      {/* Nav tabs */}
      <nav className="hidden md:flex items-end h-full gap-1">
        {NAV_TABS.map(tab => {
          const isActive = tab.match.test(pathname)
          const isExternal = tab.href.startsWith('http')
          return (
            <Link
              key={tab.label}
              href={tab.href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="relative h-full flex items-center px-4 font-condensed font-semibold uppercase tracking-[0.12em] text-[12px] transition-colors duration-150"
              style={{ color: isActive ? '#a8cdd9' : 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'
              }}
            >
              {tab.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: '#68a2b9' }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Right: Back to platform + Vendasta Sync badge + avatar */}
      <div className="flex items-center gap-3">
        <Link
          href="/home"
          className="font-condensed font-bold uppercase tracking-[0.14em] text-[12px] px-2.5 py-1 rounded transition-colors"
          style={{
            color: 'rgba(255,255,255,0.55)',
            border: '1px solid rgba(255,255,255,0.12)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'}
        >
          ← Platform
        </Link>
        <span
          className="hidden sm:inline-block font-condensed font-bold uppercase tracking-[0.14em] text-[12px] px-2.5 py-1 rounded"
          style={{
            color: '#68a2b9',
            backgroundColor: 'rgba(104,162,185,0.1)',
            border: '1px solid rgba(104,162,185,0.25)',
          }}
        >
          Vendasta Sync
        </span>

        <div
          className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0"
          style={{ backgroundColor: '#1b3c5a' }}
        >
          <span className="font-condensed font-bold text-white text-xs">
            {getInitials(displayName)}
          </span>
        </div>
      </div>
    </header>
  )
}
