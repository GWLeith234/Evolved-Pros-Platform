'use client'

import { useState } from 'react'

interface InviteMemberButtonProps {
  variant?: 'header'
}

export function InviteMemberButton({ variant: _variant = 'header' }: InviteMemberButtonProps = {}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-condensed font-bold uppercase tracking-[0.12em] text-[11px] rounded px-4 py-2 transition-all"
        style={{ backgroundColor: '#1b3c5a', color: 'white' }}
      >
        + Invite Member
      </button>
      {open && <InviteMemberModal onClose={() => setOpen(false)} />}
    </>
  )
}

function InviteMemberModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [tier, setTier] = useState<'vip' | 'pro'>('vip')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function send() {
    if (!email.trim() || !fullName.trim()) {
      setError('Enter both an email and a name.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), fullName: fullName.trim(), tier }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Invite failed')
      setSentTo(email.trim().toLowerCase())
      setEmail('')
      setFullName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Invite member"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(17,37,53,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 8,
          width: '100%',
          maxWidth: 440,
          padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-[20px] text-[#112535]">Invite member</h2>
            <p className="font-condensed text-[11px] text-[#7a8a96] mt-0.5">
              We&rsquo;ll email a magic-link sign-in.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#7a8a96] hover:text-[#112535] text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {sentTo ? (
          <div className="space-y-4">
            <p
              role="status"
              className="rounded px-3 py-2 font-body text-[13px]"
              style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: '#15803d', border: '1px solid rgba(34,197,94,0.25)' }}
            >
              ✓ Invite sent to {sentTo}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSentTo(null)}
                className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2 transition-all"
                style={{ border: '1px solid rgba(27,60,90,0.25)', color: '#1b3c5a' }}
              >
                Send another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2 transition-all"
                style={{ backgroundColor: '#1b3c5a', color: 'white' }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded px-3 py-2 font-body text-[13px] outline-none"
                style={{ border: '1px solid rgba(27,60,90,0.2)', color: '#112535' }}
              />
            </div>
            <div>
              <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full rounded px-3 py-2 font-body text-[13px] outline-none"
                style={{ border: '1px solid rgba(27,60,90,0.2)', color: '#112535' }}
              />
            </div>
            <div>
              <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
                Tier
              </label>
              <div className="flex gap-2">
                {(['vip', 'pro'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2 flex-1 transition-all"
                    style={{
                      backgroundColor: tier === t ? '#1b3c5a' : 'transparent',
                      color: tier === t ? 'white' : '#1b3c5a',
                      border: '1px solid rgba(27,60,90,0.25)',
                    }}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p
                role="alert"
                aria-live="polite"
                className="rounded px-3 py-2 font-body text-[12px]"
                style={{ backgroundColor: 'rgba(239,14,48,0.06)', color: '#ef0e30', border: '1px solid rgba(239,14,48,0.15)' }}
              >
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2"
                style={{ color: '#7a8a96' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={send}
                disabled={busy || !email.trim() || !fullName.trim()}
                className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2 transition-all disabled:opacity-50"
                style={{ backgroundColor: '#1b3c5a', color: 'white' }}
              >
                {busy ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
