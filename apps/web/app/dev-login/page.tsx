'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DevLoginPage() {
  if (process.env.NODE_ENV !== 'development') {
    return <p style={{ padding: 32, fontFamily: 'monospace' }}>404 — not available in production</p>
  }

  return <DevLoginForm />
}

function DevLoginForm() {
  const router = useRouter()
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error,  setError]  = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json() as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to generate login link')
        setStatus('error')
        return
      }

      // Redirect automatically — Supabase magic link exchanges the token
      router.push(data.url)
    } catch {
      setError('Network error')
      setStatus('error')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#112535' }}>
      <div style={{ backgroundColor: 'white', borderRadius: 8, padding: '40px 48px', width: 360 }}>
        <p style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ef0e30', marginBottom: 8 }}>
          Dev Only
        </p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 900, color: '#112535', margin: '0 0 24px' }}>
          Dev Login
        </h1>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontFamily: 'monospace', fontSize: 11, color: '#7a8a96', marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@example.com"
            autoFocus
            required
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 12px',
              border: '1px solid rgba(27,60,90,0.2)',
              borderRadius: 4,
              fontSize: 14,
              fontFamily: 'monospace',
              color: '#112535',
              boxSizing: 'border-box',
              marginBottom: 16,
              outline: 'none',
            }}
          />

          {error && (
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#ef0e30', marginBottom: 12 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 0',
              backgroundColor: '#1b3c5a',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.1em',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              opacity: status === 'loading' ? 0.6 : 1,
            }}
          >
            {status === 'loading' ? 'Redirecting…' : 'Login →'}
          </button>
        </form>
      </div>
    </div>
  )
}
