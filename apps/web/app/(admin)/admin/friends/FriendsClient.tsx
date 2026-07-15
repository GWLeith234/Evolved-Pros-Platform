'use client'

import { useMemo, useState } from 'react'

export interface FriendInvite {
  id: string
  email: string
  status: 'invited' | 'redeemed' | 'revoked'
  token: string
  sent_at: string | null
  redeemed_at: string | null
}

export interface CompCode {
  id: string
  code: string
  label: string | null
  grants_tier: string
  active: boolean
  redemption_count: number
  max_redemptions: number | null
}

// Neutral text follows the theme; TEAL/BLUE/RED stay as accent/fill constants.
const NAVY = 'var(--admin-text-strong)'
const SLATE = 'var(--admin-text-2)'
const TEAL = '#68a2b9'
const BLUE = '#1b3c5a'
const RED = '#ef0e30'

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusPill({ status }: { status: FriendInvite['status'] }) {
  const map = {
    invited: { bg: 'rgba(104,162,185,0.12)', fg: TEAL, label: 'Invited' },
    redeemed: { bg: 'rgba(34,197,94,0.1)', fg: '#15803d', label: 'Redeemed' },
    revoked: { bg: 'rgba(239,14,48,0.08)', fg: RED, label: 'Revoked' },
  }[status]
  return (
    <span
      className="font-condensed font-bold uppercase tracking-[0.1em] text-[10px] px-2 py-0.5 rounded"
      style={{ backgroundColor: map.bg, color: map.fg }}
    >
      {map.label}
    </span>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg px-5 py-4 bg-[var(--admin-card)]" style={{ border: '1px solid var(--admin-border)' }}>
      <p className="font-display font-black text-[26px]" style={{ color: NAVY }}>{value}</p>
      <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mt-0.5" style={{ color: SLATE }}>
        {label}
      </p>
    </div>
  )
}

export function FriendsClient({
  code: initialCode,
  invites: initialInvites,
  appUrl,
}: {
  code: CompCode | null
  invites: FriendInvite[]
  appUrl: string
}) {
  const [code, setCode] = useState<CompCode | null>(initialCode)
  const [invites, setInvites] = useState<FriendInvite[]>(initialInvites)
  const [togglingCode, setTogglingCode] = useState(false)

  const [composer, setComposer] = useState('')
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState<string | null>(null)
  const [sendErr, setSendErr] = useState<string | null>(null)

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const invited = invites.length
    const redeemed = invites.filter(i => i.redeemed_at != null).length
    const activeFriends = invites.filter(i => i.status === 'redeemed').length
    return { invited, redeemed, activeFriends }
  }, [invites])

  function inviteLink(token: string) {
    return `${appUrl}/welcome?token=${token}`
  }

  async function copyLink(row: FriendInvite) {
    try {
      await navigator.clipboard.writeText(inviteLink(row.token))
      setCopiedId(row.id)
      setTimeout(() => setCopiedId(c => (c === row.id ? null : c)), 1600)
    } catch {
      // Clipboard blocked — surface the URL so it can be copied manually.
      window.prompt('Copy this invite link:', inviteLink(row.token))
    }
  }

  async function toggleCode() {
    if (!code || togglingCode) return
    setTogglingCode(true)
    const next = !code.active
    try {
      const res = await fetch('/api/admin/friends/code', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: next }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; active?: boolean }
      if (res.ok && data.ok) setCode({ ...code, active: data.active ?? next })
    } finally {
      setTogglingCode(false)
    }
  }

  async function sendInvites() {
    const trimmed = composer.trim()
    if (!trimmed || sending) return
    setSending(true)
    setSendMsg(null)
    setSendErr(null)
    try {
      const res = await fetch('/api/admin/friends/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: trimmed }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        invited?: number
        delivered?: number
        invalid?: string[]
        rows?: FriendInvite[]
        error?: string
      }
      if (!res.ok || !data.ok) {
        setSendErr(data.error ?? 'Could not send invites.')
        return
      }
      // Merge returned rows into the table (replace by email, prepend new).
      if (data.rows?.length) {
        setInvites(prev => {
          const byEmail = new Map(prev.map(r => [r.email, r]))
          for (const r of data.rows!) byEmail.set(r.email, r)
          return Array.from(byEmail.values()).sort((a, b) =>
            (b.sent_at ?? '').localeCompare(a.sent_at ?? ''),
          )
        })
      }
      const parts = [`${data.invited ?? 0} invited`]
      if (typeof data.delivered === 'number') parts.push(`${data.delivered} emailed`)
      if (data.invalid?.length) parts.push(`${data.invalid.length} skipped (invalid)`)
      setSendMsg(parts.join(' · ') + '. Use Copy link to share directly if email doesn’t arrive.')
      setComposer('')
    } catch {
      setSendErr('Network error — please try again.')
    } finally {
      setSending(false)
    }
  }

  async function revoke(row: FriendInvite) {
    if (revokingId) return
    const warn =
      row.status === 'redeemed'
        ? `Revoke ${row.email}? This removes their Professional access immediately.`
        : `Revoke the invite for ${row.email}?`
    if (!window.confirm(warn)) return
    setRevokingId(row.id)
    try {
      const res = await fetch('/api/admin/friends/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean }
      if (res.ok && data.ok) {
        setInvites(prev => prev.map(r => (r.id === row.id ? { ...r, status: 'revoked' } : r)))
      }
    } finally {
      setRevokingId(null)
    }
  }

  const btnBase =
    'font-condensed font-bold uppercase tracking-[0.1em] text-[11px] rounded px-3 py-1.5 transition-all'

  return (
    <div className="space-y-6">
      {/* Code panel + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
        <div className="rounded-lg p-5 bg-[var(--admin-card)]" style={{ border: '1px solid var(--admin-border)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px]" style={{ color: SLATE }}>
                Comp code
              </p>
              <p className="font-display font-black text-[22px] tracking-[0.02em]" style={{ color: NAVY }}>
                {code?.code ?? 'FRIENDSOFGEORGE'}
              </p>
              <p className="font-condensed text-[12px] mt-0.5" style={{ color: SLATE }}>
                Grants {(code?.grants_tier ?? 'pro') === 'pro' ? 'Professional' : code?.grants_tier} · $0
                {code?.max_redemptions != null ? ` · limit ${code.max_redemptions}` : ' · unlimited'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleCode}
              disabled={togglingCode || !code}
              className={btnBase}
              style={{
                backgroundColor: code?.active ? 'rgba(34,197,94,0.1)' : 'rgba(239,14,48,0.08)',
                color: code?.active ? '#15803d' : RED,
                opacity: togglingCode ? 0.6 : 1,
              }}
              aria-pressed={code?.active ?? false}
            >
              {code?.active ? '● Active' : '○ Inactive'}
            </button>
          </div>
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <span className="font-display font-black text-[26px]" style={{ color: NAVY }}>
              {code?.redemption_count ?? 0}
            </span>
            <span className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] ml-2" style={{ color: SLATE }}>
              redemptions
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Stat label="Invited" value={stats.invited} />
          <Stat label="Redeemed" value={stats.redeemed} />
          <Stat label="Active friends" value={stats.activeFriends} />
        </div>
      </div>

      {/* Invite composer */}
      <div className="rounded-lg p-5 bg-[var(--admin-card)]" style={{ border: '1px solid var(--admin-border)' }}>
        <p className="font-display font-bold text-[16px]" style={{ color: NAVY }}>Invite friends</p>
        <p className="font-condensed text-[12px] mt-0.5 mb-3" style={{ color: SLATE }}>
          One or more emails, separated by commas or new lines. We’ll email a magic link and
          you can also copy each link to send manually.
        </p>
        <textarea
          value={composer}
          onChange={e => setComposer(e.target.value)}
          placeholder="jane@example.com, john@example.com"
          rows={3}
          className="w-full rounded-lg px-3 py-2.5 font-body text-[14px] outline-none"
          style={{ border: '1px solid rgba(17,37,53,0.15)', color: NAVY }}
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={sendInvites}
            disabled={sending || !composer.trim()}
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px] rounded px-4 py-2 transition-all"
            style={{ backgroundColor: BLUE, color: 'white', opacity: sending || !composer.trim() ? 0.55 : 1 }}
          >
            {sending ? 'Sending…' : 'Send invites'}
          </button>
          {sendMsg && <span className="font-condensed text-[12px]" style={{ color: '#15803d' }}>{sendMsg}</span>}
          {sendErr && <span className="font-condensed text-[12px]" style={{ color: RED }}>{sendErr}</span>}
        </div>
      </div>

      {/* Tracking table */}
      <div className="rounded-lg bg-[var(--admin-card)] overflow-hidden" style={{ border: '1px solid var(--admin-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                {['Email', 'Status', 'Sent', 'Redeemed', ''].map((h, i) => (
                  <th
                    key={h || 'actions'}
                    className="text-left font-condensed font-bold uppercase tracking-[0.12em] text-[10px] px-4 py-3"
                    style={{ color: SLATE, textAlign: i === 4 ? 'right' : 'left' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center font-body text-[13px]" style={{ color: SLATE }}>
                    No invites yet. Add emails above to get started.
                  </td>
                </tr>
              ) : (
                invites.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <td className="px-4 py-3 font-body text-[13px]" style={{ color: NAVY }}>{row.email}</td>
                    <td className="px-4 py-3"><StatusPill status={row.status} /></td>
                    <td className="px-4 py-3 font-condensed text-[12px]" style={{ color: SLATE }}>{fmtDate(row.sent_at)}</td>
                    <td className="px-4 py-3 font-condensed text-[12px]" style={{ color: SLATE }}>{fmtDate(row.redeemed_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => copyLink(row)}
                          className={btnBase}
                          style={{ border: `1px solid ${TEAL}`, color: TEAL }}
                        >
                          {copiedId === row.id ? '✓ Copied' : 'Copy link'}
                        </button>
                        {row.status !== 'revoked' && (
                          <button
                            type="button"
                            onClick={() => revoke(row)}
                            disabled={revokingId === row.id}
                            className={btnBase}
                            style={{ border: '1px solid rgba(239,14,48,0.3)', color: RED, opacity: revokingId === row.id ? 0.5 : 1 }}
                          >
                            {revokingId === row.id ? '…' : 'Revoke'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
