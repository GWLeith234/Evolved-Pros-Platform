'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MoreDrawer } from './MoreDrawer'

interface BottomTabBarProps {
  role: string | null
  unreadCount: number
  dmUnreadCount?: number
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

interface TabItem {
  label: string
  href: string
  match: RegExp
  icon: React.ReactNode
}

// Primary DAU loops on the thumb bar. Goals folded into Home; Podcast/Media
// under More.
const TABS: TabItem[] = [
  { label: 'Home',      href: '/home',       match: /^\/home$/,      icon: <HomeIcon /> },
  { label: 'Community', href: '/community',  match: /^\/community/,  icon: <UsersIcon /> },
  { label: 'Academy',   href: '/academy',    match: /^\/academy/,    icon: <BookIcon /> },
  { label: 'LIVE',      href: '/live',       match: /^\/live/,       icon: <CalendarIcon /> },
]

export function BottomTabBar({ role, unreadCount, dmUnreadCount = 0 }: BottomTabBarProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = /^\/(messages|profile|settings|admin|leaderboard|membership|podcast)/.test(pathname)

  return (
    <>
      <nav
        className="ep-bottom-tabs lg:hidden flex items-stretch fixed bottom-0 left-0 right-0 z-50"
        style={{
          backgroundColor: 'var(--bg-nav)',
          borderTop: '1px solid var(--border-color)',
          /* Backdrop blur for iOS over-scroll under the bar */
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        aria-label="Primary"
      >
        <div
          className="flex items-stretch w-full"
          style={{ height: 56 }}
        >
          {TABS.map(tab => {
            const active = tab.match.test(pathname)
            const isCommunity = tab.href === '/community'
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative ep-touch-target"
                aria-current={active ? 'page' : undefined}
                style={{
                  color: active ? 'var(--brand-teal, #0ABFA3)' : 'var(--text-tertiary)',
                  background: active ? 'rgba(10,191,163,0.10)' : 'transparent',
                  minHeight: 48,
                }}
              >
                <span className="relative" aria-hidden="true">
                  {tab.icon}
                  {isCommunity && unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-[6px] h-[6px] rounded-full"
                      style={{ backgroundColor: 'var(--brand-red-hot, #ef0e30)' }}
                      aria-hidden="true"
                    />
                  )}
                </span>
                {isCommunity && unreadCount > 0 && (
                  <span className="sr-only">{unreadCount} unread notifications</span>
                )}
                <span
                  className="font-condensed font-semibold uppercase tracking-wide"
                  style={{ fontSize: '9px', letterSpacing: '0.06em' }}
                >
                  {tab.label}
                </span>
              </Link>
            )
          })}

          {/* More tab */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative ep-touch-target"
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label="More navigation"
            style={{
              color: isMoreActive ? 'var(--brand-teal, #0ABFA3)' : 'var(--text-tertiary)',
              background: isMoreActive ? 'rgba(10,191,163,0.10)' : 'transparent',
              minHeight: 48,
            }}
          >
            <span className="relative" aria-hidden="true">
              <GridIcon />
              {dmUnreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-[6px] h-[6px] rounded-full"
                  style={{ backgroundColor: 'var(--brand-red-hot, #ef0e30)' }}
                />
              )}
            </span>
            {dmUnreadCount > 0 && (
              <span className="sr-only">{dmUnreadCount} unread messages</span>
            )}
            <span
              className="font-condensed font-semibold uppercase tracking-wide"
              style={{ fontSize: '9px', letterSpacing: '0.06em' }}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      <MoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} role={role} />
    </>
  )
}
