'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotifBell } from '@/components/notifications/NotifBell'

interface TopNavProps {
  profile: {
    id: string
    display_name: string | null
    full_name: string | null
    avatar_url: string | null
    tier: string | null
  }
  unreadCount?: number
}

const NAV_TABS = [
  { label: 'Home',      href: '/home',      match: /^\/home$/ },
  { label: 'Community', href: '/community', match: /^\/community/ },
  { label: 'Events',    href: '/events',    match: /^\/events/ },
  { label: 'Academy',   href: '/academy',   match: /^\/academy/ },
]

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function TopNav({ profile, unreadCount = 0 }: TopNavProps) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const displayName = profile.display_name ?? profile.full_name ?? ''

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 flex-shrink-0"
        style={{
          backgroundColor: '#112535',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <Link
          href="/home"
          className="font-condensed font-bold text-white tracking-[0.14em] text-base select-none"
        >
          EVOLVED<span className="text-[#ef0e30]">·</span>PROS
        </Link>

        {/* Nav tabs */}
        <nav className="hidden md:flex items-end h-full gap-1">
          {NAV_TABS.map(tab => {
            const isActive = tab.match.test(pathname)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative h-full flex items-center px-4 font-condensed font-semibold uppercase tracking-[0.12em] text-[11px] transition-colors duration-150"
                style={{
                  color: isActive ? '#a8cdd9' : 'rgba(255,255,255,0.45)',
                }}
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

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <NotifBell initialUnreadCount={unreadCount} userId={profile.id} />

          {/* Avatar with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(o => !o)}
              className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0 focus:outline-none"
              style={{ backgroundColor: '#ef0e30' }}
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <span className="font-condensed font-bold text-white text-xs">
                  {getInitials(displayName)}
                </span>
              )}
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-44 rounded overflow-hidden z-50"
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid rgba(27,60,90,0.1)',
                  boxShadow: '0 4px 16px rgba(27,60,90,0.14)',
                  top: '100%',
                }}
              >
                <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}>
                  <p className="font-condensed font-bold text-[12px] truncate" style={{ color: '#1b3c5a' }}>
                    {displayName || 'My Account'}
                  </p>
                </div>
                <Link
                  href="/profile/me"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-body transition-colors"
                  style={{ color: '#1b3c5a' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(27,60,90,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-body transition-colors"
                  style={{ color: '#1b3c5a' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(27,60,90,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Settings
                </Link>
                <div style={{ borderTop: '1px solid rgba(27,60,90,0.08)' }}>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-[13px] font-body transition-colors"
                    style={{ color: '#ef0e30' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,14,48,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

    </>
  )
}
