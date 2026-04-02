'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NotifBell } from '@/components/notifications/NotifBell'
import { Tooltip } from '@/components/ui/Tooltip'
import { AskGeorgeDrawer } from '@/components/layout/AskGeorgeDrawer'
import { tierColorRgba } from '@/lib/tier-color'

const BASE = 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding'
const FALLBACK_LOGO_DARK  = `${BASE}/logo_nav_dark.png`
const FALLBACK_LOGO_LIGHT = `${BASE}/logo_nav_light.png`

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
  membersCanToggleTheme?: boolean
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

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
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

export function TopNav({ profile, unreadCount = 0, logoUrl, logoLightUrl, membersCanToggleTheme = true }: TopNavProps) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isDark, setIsDark] = useState(true)
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

  // Sync toggle state with whatever the inline script already applied
  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light-mode')
    setIsDark(!isLight)
  }, [])

  function handleThemeToggle() {
    const goLight = isDark
    setIsDark(!isDark)
    if (goLight) {
      document.documentElement.classList.add('light-mode')
      localStorage.setItem('ep_theme', 'light')
    } else {
      document.documentElement.classList.remove('light-mode')
      localStorage.setItem('ep_theme', 'dark')
    }
  }

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
        {/* Logo — inline SVG brand mark */}
        <Link href="/home" className="flex items-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 36" height="36" aria-label="Evolved Pros" style={{ display: 'block' }}>
            <text x="0" y="26" fontFamily="'Barlow Condensed', sans-serif" fontWeight="700" fontSize="28" fill="white" letterSpacing="1">EVOLVED</text>
            <text x="88" y="26" fontFamily="'Barlow Condensed', sans-serif" fontWeight="700" fontSize="28" fill="white" letterSpacing="1">PR</text>
            <circle cx="124" cy="18" r="10" fill="#ef0e30"/>
            <line x1="124" y1="12" x2="124" y2="24" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="118" y1="18" x2="130" y2="18" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="119" y1="21.5" x2="129" y2="21.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <text x="137" y="26" fontFamily="'Barlow Condensed', sans-serif" fontWeight="700" fontSize="28" fill="white" letterSpacing="1">S</text>
          </svg>
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

          {/* Theme toggle */}
          {membersCanToggleTheme && (
            <button
              type="button"
              onClick={handleThemeToggle}
              className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0 transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          )}

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
