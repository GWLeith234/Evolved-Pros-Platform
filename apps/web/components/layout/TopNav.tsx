'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
// useEffect kept for click-outside handler
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NotifBell } from '@/components/notifications/NotifBell'
import { Tooltip } from '@/components/ui/Tooltip'
import { AskGeorgeDrawer } from '@/components/layout/AskGeorgeDrawer'
import { tierColorRgba } from '@/lib/tier-color'
import { LogoMark } from '@/components/ui/LogoMark'


interface TopNavProps {
  profile: {
    id: string
    display_name: string | null
    full_name: string | null
    avatar_url: string | null
    tier: string | null
  }
  unreadCount?: number
  logoUrl?: string | null
  logoLightUrl?: string | null
  membersCanToggleTheme?: boolean  // kept for backwards-compat; no longer used
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}


const NEXT_EPISODE_DAY       = 'Mon'
const NEXT_EPISODE_MONTH_DAY = 'April 20'

const NAV_ITEMS = [
  { label: 'Home',      href: '/home' },
  { label: 'Community', href: '/community' },
  { label: 'Events',    href: '/events' },
  { label: 'Academy',   href: '/academy' },
  { label: 'Podcast',   href: '/podcast' },
]

export function TopNav({ profile, unreadCount = 0, logoUrl, logoLightUrl, membersCanToggleTheme: _membersCanToggleTheme }: TopNavProps) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [georgeOpen, setGeorgeOpen] = useState(false)

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
      <AskGeorgeDrawer isOpen={georgeOpen} onClose={() => setGeorgeOpen(false)} />
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 flex-shrink-0 relative"
        style={{
          backgroundColor: '#112535',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <Link href="/home" className="flex items-center flex-shrink-0" style={{ textDecoration: 'none' }}>
          <LogoMark variant="light" height={36} />
        </Link>

        {/* Primary nav links — desktop */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="font-condensed uppercase tracking-[0.1em] text-[12px] px-3 py-1.5 rounded transition-colors"
                style={{ color: active ? '#C9A84C' : 'rgba(255,255,255,0.45)', fontWeight: active ? 600 : 500 }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Episode promo card */}
          <a
            href="/events"
            className="hidden md:flex"
            style={{
              background: '#112535',
              border: '1px solid #1b3c5a',
              borderRadius: '6px',
              padding: '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              flexShrink: 0,
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#ef0e30')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#1b3c5a')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ color: '#ef0e30', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Next Episode
              </span>
              <span style={{ color: 'white', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                Dennis Yu
              </span>
              <span style={{ color: '#68a2b9', fontSize: '10px', whiteSpace: 'nowrap' }}>
                {NEXT_EPISODE_DAY} · {NEXT_EPISODE_MONTH_DAY}
              </span>
            </div>
            <span style={{ color: '#ef0e30', fontSize: '12px', marginLeft: '2px' }}>▶</span>
          </a>

          {/* Ask George */}
          <Tooltip content="Ask George">
            <button
              type="button"
              onClick={() => setGeorgeOpen(o => !o)}
              className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0 transition-colors"
              style={{ color: georgeOpen ? '#A78BFA' : 'rgba(167,139,250,0.55)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#A78BFA')}
              onMouseLeave={e => (e.currentTarget.style.color = georgeOpen ? '#A78BFA' : 'rgba(167,139,250,0.55)')}
              aria-label="Ask George AI"
            >
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <text x="1" y="20" fontFamily="'Barlow Condensed', sans-serif" fontWeight="700" fontSize="17" fill="currentColor" letterSpacing="0.5">AI</text>
                <line x1="23" y1="3" x2="23" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="20" y1="6" x2="26" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="21" y1="4" x2="25" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="25" y1="4" x2="21" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          </Tooltip>

          {/* Notification bell */}
          <NotifBell initialUnreadCount={unreadCount} userId={profile.id} />

          {/* Avatar with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(o => !o)}
              className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 focus:outline-none"
              style={{ backgroundColor: '#ef0e30', boxShadow: `0 0 0 2px ${tierColorRgba(profile.tier, 0.4)}` }}
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
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
