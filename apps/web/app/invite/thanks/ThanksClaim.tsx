'use client'

import { useState } from 'react'

export function ThanksClaim({ token }: { token: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  async function claim() {
    if (status === 'loading') return
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/invite/thanks/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        loginUrl?: string
        error?: string
      }
      if (!res.ok || !data.ok || !data.loginUrl) {
        setStatus('error')
        setError(data.error ?? 'Could not claim your Community access. Please try again.')
        return
      }
      window.location.href = data.loginUrl
    } catch {
      setStatus('error')
      setError('Network error. Please try again.')
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
          backgroundColor: 'var(--brand-red)',
          color: 'var(--text-primary)',
          opacity: status === 'loading' ? 0.6 : 1,
          cursor: status === 'loading' ? 'wait' : 'pointer',
        }}
      >
        {status === 'loading' ? 'Setting up your access...' : 'Claim Community access'}
      </button>
      {status === 'error' && error && (
        <p className="font-body text-[13px] mt-4" style={{ color: 'var(--brand-red)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
