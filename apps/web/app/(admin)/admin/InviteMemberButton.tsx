'use client'

import { useState } from 'react'

type Tier = 'vip' | 'pro'
type Status = 'idle' | 'loading' | 'success' | 'error'

export function InviteMemberButton() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [tier, setTier] = useState<Tier>('vip')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function reset() {
    setEmail('')
    setFullName('')
    setTier('vip')
    setStatus('idle')
    setErrorMsg('')
  }

  function close() {
    setOpen(false)
    reset()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, tier }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong.')
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch {
      setErrorMsg('Network error — please try again.')
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid rgba(27,60,90,0.18)',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    color: '#112535',
    outline: 'none',
    backgroundColor: '#fff',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-condensed)',
    fontWeight: 700,
    fontSize: '10px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#7a8a96',
    marginBottom: '5px',
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 font-condensed font-bold uppercase tracking-[0.12em] text-[11px] px-4 py-2 rounded transition-colors"
        style={{ backgroundColor: '#1b3c5a', color: '#fff' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#112535')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1b3c5a')}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
        Invite Member
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(13,28,39,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={e => { if (e.target === e.currentTarget) close() }}
        >
          <div
            className="w-full max-w-md rounded-xl shadow-2xl"
            style={{ backgroundColor: '#fff', border: '1px solid rgba(27,60,90,0.1)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}
            >
              <div>
                <h2 className="font-display font-black text-[18px]" style={{ color: '#112535' }}>
                  Invite Member
                </h2>
                <p className="font-condensed text-[11px] mt-0.5" style={{ color: '#7a8a96' }}>
                  They'll receive an email with a sign-in link.
                </p>
              </div>
              <button
                onClick={close}
                style={{ color: 'rgba(27,60,90,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#1b3c5a')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(27,60,90,0.35)')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {status === 'success' ? (
                <div className="text-center py-6">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <p className="font-condensed font-bold text-[14px]" style={{ color: '#112535' }}>
                    Invite sent to {email}
                  </p>
                  <p className="font-condensed text-[11px] mt-1 mb-5" style={{ color: '#7a8a96' }}>
                    They'll get a sign-in link. Their tier is set to{' '}
                    <span style={{ color: '#1b3c5a', fontWeight: 700 }}>{tier === 'pro' ? 'Pro' : 'Community'}</span>.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={reset}
                      className="font-condensed font-bold uppercase tracking-[0.12em] text-[11px] px-4 py-2 rounded transition-colors"
                      style={{ backgroundColor: 'rgba(27,60,90,0.06)', color: '#1b3c5a' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(27,60,90,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(27,60,90,0.06)')}
                    >
                      Invite Another
                    </button>
                    <button
                      onClick={close}
                      className="font-condensed font-bold uppercase tracking-[0.12em] text-[11px] px-4 py-2 rounded transition-colors"
                      style={{ backgroundColor: '#1b3c5a', color: '#fff' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#112535')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1b3c5a')}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Smith"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Tier</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['vip', 'pro'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTier(t)}
                          className="rounded-lg py-3 font-condensed font-bold uppercase tracking-[0.12em] text-[11px] transition-all"
                          style={{
                            backgroundColor: tier === t ? (t === 'pro' ? 'rgba(201,168,76,0.1)' : 'rgba(27,60,90,0.06)') : 'transparent',
                            border: `1.5px solid ${tier === t ? (t === 'pro' ? '#c9a84c' : '#1b3c5a') : 'rgba(27,60,90,0.12)'}`,
                            color: tier === t ? (t === 'pro' ? '#c9a84c' : '#1b3c5a') : '#7a8a96',
                          }}
                        >
                          {t === 'pro' ? 'Professional' : 'VIP'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {status === 'error' && (
                    <p
                      className="font-condensed text-[11px] px-3 py-2 rounded"
                      style={{ backgroundColor: 'rgba(239,14,48,0.06)', color: '#ef0e30', border: '1px solid rgba(239,14,48,0.15)' }}
                    >
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full py-2.5 rounded font-condensed font-bold uppercase tracking-[0.14em] text-[11px] transition-colors"
                    style={{
                      backgroundColor: status === 'loading' ? 'rgba(27,60,90,0.5)' : '#1b3c5a',
                      color: '#fff',
                      cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {status === 'loading' ? 'Sending Invite…' : 'Send Invite'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
