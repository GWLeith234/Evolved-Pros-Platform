'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AdminSidebarNav } from './AdminSidebar'
import { LogoMark } from '@/components/ui/LogoMark'
import { useTheme } from '@/components/theme/ThemeProvider'
import { toggleLabel } from '@/lib/theme'

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
  const { preference, toggleTheme } = useTheme()
  const themeLabel = toggleLabel(preference)

  useEffect(() => {
    if (!mobileMenuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileMenuOpen])

  return (
    <header
      className="admin-topnav sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 h-14 flex-shrink-0"
      style={{
        backgroundColor: 'var(--admin-card)',
        borderBottom: '1px solid var(--admin-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open admin navigation"
          aria-expanded={mobileMenuOpen}
          className="md:hidden -ml-1 inline-flex items-center justify-center rounded"
          style={{ color: 'var(--admin-text)', width: 44, height: 44 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
        {/* Navy lockup on white chrome. Do not use the CSS EVOLVED·PROS wordmark. */}
        <Link
          href="/admin"
          aria-label="Evolved Pros Admin"
          className="flex items-center flex-shrink-0 select-none"
          style={{ textDecoration: 'none' }}
        >
          <LogoMark variant="dark" height={28} />
        </Link>
        <span
          className="hidden sm:inline-flex items-center font-body text-[12px] px-2 py-0.5 rounded"
          style={{
            color: 'var(--admin-text)',
            backgroundColor: 'var(--admin-subtle)',
            border: '1px solid var(--admin-border)',
          }}
        >
          Admin
        </span>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close admin navigation"
            onClick={() => setMobileMenuOpen(false)}
            style={{ backgroundColor: 'var(--admin-overlay)', border: 'none', padding: 0 }}
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-[min(280px,88vw)] flex-col py-3"
            style={{
              backgroundColor: 'var(--admin-card)',
              borderRight: '1px solid var(--admin-border)',
            }}
          >
            <div className="flex items-center justify-between px-3 mb-2">
              <LogoMark variant="dark" height={24} />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close admin navigation"
                className="inline-flex items-center justify-center rounded"
                style={{ width: 44, height: 44, color: 'var(--admin-text)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <AdminSidebarNav onSelect={() => setMobileMenuOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/home"
          className="hidden sm:inline-flex items-center justify-center min-h-[44px] px-3 font-body text-[13px] rounded"
          style={{
            color: 'var(--admin-text)',
            border: '1px solid var(--admin-border)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Platform
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
          className="inline-flex items-center justify-center rounded flex-shrink-0"
          style={{
            width: 44,
            height: 44,
            color: 'var(--admin-text)',
            border: '1px solid var(--admin-border)',
          }}
        >
          {preference === 'system' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="13" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          ) : preference === 'light' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <div
          className="inline-flex items-center justify-center rounded flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            backgroundColor: 'var(--admin-text-strong)',
            border: '1px solid var(--admin-border)',
          }}
        >
          <span className="font-condensed font-bold text-xs" style={{ color: 'var(--admin-on-accent)' }}>
            {getInitials(displayName)}
          </span>
        </div>
      </div>
    </header>
  )
}
