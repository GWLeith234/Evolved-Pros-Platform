import type { Metadata } from 'next'
import { LogoMark } from '@/components/ui/LogoMark'

export const metadata: Metadata = {
  title: 'Closed beta — Evolved Pros',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// SPRINT Q — closed-beta lockout screen. Shown to non-admin, non-comped members
// whose access_status is 'suspended' (the middleware beta gate redirects here).
// No nav by design. The outer frame follows the theme (light + dark); the
// branded card is a constant navy lockup with the white horizontal logo IMAGE
// (the canonical /logo_horizontal_dark.png via LogoMark variant="light" — the
// Supabase 'branding' bucket has no logo_horizontal_white.png).
export default function BetaPausedPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      <div
        className="w-full max-w-md rounded-xl p-10 text-center"
        style={{
          backgroundColor: '#112535',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 20px 60px rgba(10,15,24,0.35)',
        }}
      >
        <div className="flex justify-center mb-8">
          <LogoMark variant="light" height={32} alt="Evolved Pros" />
        </div>

        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.28)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 7 12 12 15 14" />
          </svg>
        </div>

        <h1 className="font-display font-bold text-white mb-3" style={{ fontSize: '24px' }}>
          Evolved Pros is in closed beta.
        </h1>
        <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Your access is paused for now — we&rsquo;ll be in touch.
        </p>
      </div>
    </div>
  )
}
