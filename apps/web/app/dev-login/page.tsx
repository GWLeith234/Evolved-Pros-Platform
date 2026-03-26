'use client'

import { useState } from 'react'

export default function DevLoginPage() {
  if (process.env.NODE_ENV !== 'development') return <p>404</p>
  return <DevLoginForm />
}

function DevLoginForm() {
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')

  async function handleLogin() {
    setStatus('loading')
    const res = await fetch('/api/dev-login', { method: 'POST' })
    const data = await res.json() as { url?: string; error?: string }
    if (data.url) {
      window.location.href = data.url
    } else {
      setStatus('idle')
      alert(data.error ?? 'Login failed')
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#112535' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 8, width: 320, textAlign: 'center' }}>
        <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ef0e30', margin: '0 0 8px' }}>
          Dev Only
        </p>
        <h2 style={{ margin: '0 0 24px', fontFamily: 'Georgia, serif', fontSize: 22, color: '#112535' }}>
          Dev Login
        </h2>
        <p style={{ fontSize: 13, color: '#7a8a96', margin: '0 0 24px', fontFamily: 'sans-serif' }}>
          Logs in as <strong>dev@evolvedpros.com</strong><br />with admin + pro access.
        </p>
        <button
          onClick={handleLogin}
          disabled={status === 'loading'}
          style={{
            width: '100%', padding: '12px 0',
            background: status === 'loading' ? '#7a8a96' : '#1b3c5a',
            color: 'white', border: 'none', borderRadius: 4,
            fontSize: 14, fontWeight: 600, cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            fontFamily: 'sans-serif',
          }}
        >
          {status === 'loading' ? 'Logging in…' : 'Log in as Admin →'}
        </button>
      </div>
    </div>
  )
}
