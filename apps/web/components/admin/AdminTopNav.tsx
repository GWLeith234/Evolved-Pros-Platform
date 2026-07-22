'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { AdminSidebarNav } from './AdminSidebar'
import { useTheme } from '@/components/theme/ThemeProvider'

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
  const displayName = profile.display_name ?? profile.full_name ?? ''
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Admins can toggle the whole app theme from the admin shell. The topnav is
  // always dark chrome, so the icon keeps a fixed light color (a theme-driven
  // token would go navy-on-navy in light mode).
  const { resolvedTheme, toggleTheme } = useTheme()

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

      {/* Nav lives in the left rail (AdminSidebar) — the top bar carries only
          brand, platform link, theme toggle, and avatar. The former duplicate
          top-bar tabs and sync badge were removed in the nav dedup; remaining
          legacy CRM links live under the rail's "Legacy CRM" section until
          the in-house migration removes them. */}

      {/* Right: Back to platform + theme toggle + avatar */}
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

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0 transition-colors"
          style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.95)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'}
        >
          {resolvedTheme === 'dark' ? (
            // Sun — click to go light
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            // Moon — click to go dark
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

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
