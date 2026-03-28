'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotifBell } from '@/components/notifications/NotifBell'
import { Tooltip } from '@/components/ui/Tooltip'
import { AskGeorgeDrawer } from '@/components/layout/AskGeorgeDrawer'

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

type NextEvent = { id: string; title: string; starts_at: string } | null

export function TopNav({ profile, unreadCount = 0, logoUrl, logoLightUrl, membersCanToggleTheme = true }: TopNavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [nextEvent, setNextEvent] = useState<NextEvent>(null)
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

  // Fetch next upcoming event
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('events')
      .select('id, title, starts_at')
      .eq('is_published', true)
      .gt('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setNextEvent(data)
      })
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
        className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 flex-shrink-0"
        style={{
          backgroundColor: '#112535',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo — swaps between dark/light variant when theme toggles */}
        <Link href="/home" className="flex items-center flex-shrink-0">
          {(isDark ? logoUrl : (logoLightUrl ?? logoUrl)) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={isDark ? logoUrl! : (logoLightUrl ?? logoUrl)!}
              alt="Evolved Pros"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
            />
          ) : (
            <span className="font-condensed font-bold text-white tracking-[0.14em] text-base select-none">
              EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
            </span>
          )}
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Next event card */}
          {nextEvent && (
            <Tooltip content="Your next upcoming event. Click to view details.">
            <a
              href={`/events`}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '0.5px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                maxWidth: '240px',
                textDecoration: 'none',
                flexShrink: 0,
              }}
              className="hidden md:flex"
            >
              <span style={{ background: '#ef0e30', borderRadius: '4px', padding: '2px 6px', color: 'white', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                NEXT EVENT
              </span>
              <span style={{ color: 'white', fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nextEvent.title}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </a>
            </Tooltip>
          )}

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
              style={{ color: georgeOpen ? '#68a2b9' : 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#68a2b9')}
              onMouseLeave={e => (e.currentTarget.style.color = georgeOpen ? '#68a2b9' : 'rgba(255,255,255,0.5)')}
              aria-label="Ask George AI"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
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
              style={{ backgroundColor: '#ef0e30' }}
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
