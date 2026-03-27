'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MoreDrawerProps {
  open: boolean
  onClose: () => void
  role: string | null
}

function MessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M20 12h2M2 12h2M12 20v2M12 2v2" />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function BrushIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L3 14.67V21h6.33l10.06-10.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function LogOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

const linkClass = "w-full flex items-center gap-3 py-4 px-6 font-condensed font-semibold text-sm transition-colors"

const LOGO_CIRCLE_DARK  = 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/logo_circle_dark.png'
const LOGO_CIRCLE_LIGHT = 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/logo_circle_light.png'

export function MoreDrawer({ open, onClose, role }: MoreDrawerProps) {
  const router = useRouter()
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(!document.documentElement.classList.contains('light-mode'))
  }, [open])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl"
        style={{
          backgroundColor: '#112535',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Handle bar + logo */}
        <div className="flex flex-col items-center pt-3 pb-2 gap-2">
          <div
            className="rounded-full"
            style={{ width: '32px', height: '4px', backgroundColor: 'rgba(255,255,255,0.2)' }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isDark ? LOGO_CIRCLE_DARK : LOGO_CIRCLE_LIGHT}
            alt="Evolved Pros"
            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'contain' }}
          />
        </div>

        {/* Links */}
        <Link
          href="/messages"
          onClick={onClose}
          className={linkClass}
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          <MessageIcon />
          Messages
        </Link>

        <Link
          href="/profile/me"
          onClick={onClose}
          className={linkClass}
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          <PersonIcon />
          My Profile
        </Link>

        <Link
          href="/settings"
          onClick={onClose}
          className={linkClass}
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          <GearIcon />
          Settings
        </Link>

        {role === 'admin' && (
          <>
            <Link
              href="/admin"
              onClick={onClose}
              className={linkClass}
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              <BarChartIcon />
              Admin Dashboard
            </Link>

            <Link
              href="/admin/branding"
              onClick={onClose}
              className={linkClass}
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              <BrushIcon />
              Branding
            </Link>
          </>
        )}

        {/* Divider */}
        <div
          className="mx-6 my-1"
          style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }}
        />

        {/* Sign Out */}
        <button
          type="button"
          onClick={handleSignOut}
          className={linkClass}
          style={{ color: '#ef0e30' }}
        >
          <LogOutIcon />
          Sign Out
        </button>

        <div className="pb-2" />
      </div>
    </>
  )
}
