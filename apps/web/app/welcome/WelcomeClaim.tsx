'use client'

import { useState } from 'react'

// Claims the invite: POST the token, then redirect the browser to the returned
// Supabase login link so /auth/callback establishes the session and lands the
// member on /home with their new Professional access live.
export function WelcomeClaim({ token }: { token: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  async function claim() {
    if (status === 'loading') return
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/welcome/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; loginUrl?: string; error?: string }
      if (!res.ok || !data.ok || !data.loginUrl) {
        setStatus('error')
        setError(data.error ?? 'Could not claim your access. Please try again.')
        return
      }
      // Hand off to the standard auth callback → /home.
      window.location.href = data.loginUrl
    } catch {
      setStatus('error')
      setError('Network error — please try again.')
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={claim}
        disabled={status === 'loading'}
        className="inline-block py-3.5 px-8 rounded-lg font-condensed font-bold uppercase tracking-[0.1em] text-[13px] transition-opacity hover:opacity-90"
        style={{
          backgroundColor: '#C9302A',
          color: '#fff',
          opacity: status === 'loading' ? 0.6 : 1,
          cursor: status === 'loading' ? 'wait' : 'pointer',
        }}
      >
        {status === 'loading' ? 'Setting up your access…' : 'Claim my access →'}
      </button>
      {status === 'error' && error && (
        <p className="font-body text-[13px] mt-4" style={{ color: '#C9302A' }}>
          {error}
        </p>
      )}
    </div>
  )
}
