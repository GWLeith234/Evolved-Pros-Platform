'use client'

import { useState } from 'react'

export default function DevLoginPage() {
  if (process.env.NODE_ENV !== 'development') return <p>404</p>
  return <DevLoginForm />
}

function DevLoginForm() {
  const [email, setEmail] = useState('geoleith@gmail.com')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const res = await fetch('/api/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json() as { url?: string; error?: string }
    if (data.url) {
      setStatus('done')
      window.location.href = data.url
    } else {
      setStatus('error')
      setMsg(data.error ?? 'Unknown error')
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#112535' }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: 40, borderRadius: 8, width: 340 }}>
        <h2 style={{ margin: '0 0 20px', fontFamily: 'sans-serif' }}>Dev Login</h2>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ display: 'block', width: '100%', padding: '10px 12px', marginBottom: 16, fontSize: 14, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4 }}
        />
        {msg && <p style={{ color: 'red', fontSize: 13, marginBottom: 12 }}>{msg}</p>}
        <button
          type="submit"
          disabled={status === 'loading' || status === 'done'}
          style={{ width: '100%', padding: '10px 0', background: '#1b3c5a', color: 'white', border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer' }}
        >
          {status === 'loading' ? 'Generating…' : status === 'done' ? 'Redirecting…' : 'Login →'}
        </button>
      </form>
    </div>
  )
}
