'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useTheme } from '@/components/theme/ThemeProvider'

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

function CreditCardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
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

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function NewspaperIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  )
}

const linkClass = "w-full flex items-center gap-3 py-4 px-6 font-condensed font-semibold text-sm transition-colors"

const LOGO_CIRCLE_DARK  = 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/logo_circle_dark.png'
const LOGO_CIRCLE_LIGHT = 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/logo_circle_light.png'

export function MoreDrawer({ open, onClose, role }: MoreDrawerProps) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const sheetRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Sprint 4B: Escape + initial focus for keyboard / SR users
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    // Move focus into the sheet after open
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0)
    // Prevent background scroll while open
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  async function handleSignOut() {
    const { createClient } = await import('@/lib/supabase/client')
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
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="More navigation"
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-color)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Handle bar + logo + close */}
        <div className="relative flex flex-col items-center pt-3 pb-2 gap-2">
          <div
            className="rounded-full"
            style={{ width: '32px', height: '4px', backgroundColor: 'var(--text-tertiary)' }}
            aria-hidden="true"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isDark ? LOGO_CIRCLE_DARK : LOGO_CIRCLE_LIGHT}
            alt=""
            aria-hidden="true"
            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'contain' }}
          />
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="ep-touch-target absolute right-3 top-3"
            aria-label="Close more menu"
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="sr-only">More navigation</p>

        {/* Destinations that left the thumb bar to keep Podcast primary */}
        <Link
          href="/live"
          onClick={onClose}
          className={linkClass}
          style={{ color: 'var(--text-primary)', minHeight: 52 }}
        >
          <CalendarIcon />
          LIVE
        </Link>

        <Link
          href="/media"
          onClick={onClose}
          className={linkClass}
          style={{ color: 'var(--text-primary)', minHeight: 52 }}
        >
          <NewspaperIcon />
          Media
        </Link>

        <Link
          href="/messages"
          onClick={onClose}
          className={linkClass}
          style={{ color: 'var(--text-primary)', minHeight: 52 }}
        >
          <MessageIcon />
          Messages
        </Link>

        <Link
          href="/profile/me"
          onClick={onClose}
          className={linkClass}
          style={{ color: 'var(--text-primary)' }}
        >
          <PersonIcon />
          My Profile
        </Link>

        <Link
          href="/membership"
          onClick={onClose}
          className={linkClass}
          style={{ color: 'var(--text-primary)' }}
        >
          <CreditCardIcon />
          Membership
        </Link>

        <Link
          href="/profile/me"
          onClick={onClose}
          className={linkClass}
          style={{ color: 'var(--text-primary)' }}
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
              style={{ color: 'var(--text-primary)' }}
            >
              <BarChartIcon />
              Admin Dashboard
            </Link>

            <Link
              href="/admin/branding"
              onClick={onClose}
              className={linkClass}
              style={{ color: 'var(--text-primary)' }}
            >
              <BrushIcon />
              Branding
            </Link>
          </>
        )}

        {/* Divider */}
        <div
          className="mx-6 my-1"
          style={{ height: '1px', backgroundColor: 'var(--border-color)' }}
        />

        {/* Sign Out */}
        <button
          type="button"
          onClick={handleSignOut}
          className={linkClass}
          style={{ color: 'var(--brand-red-hot)' }}
        >
          <LogOutIcon />
          Sign Out
        </button>

        <div className="pb-2" />
      </div>
    </>
  )
}
