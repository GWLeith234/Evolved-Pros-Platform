'use client'

import { useMemo, useState } from 'react'
import { CONFIRM } from '@/components/admin/safety/confirmCopy'
import { useConfirmDialog } from '@/components/admin/safety/useConfirmDialog'
import type { ThanksAdminCounts } from '@/lib/thanks/counts'
import type { ThanksCadenceStep, ThanksInviteStatus } from '@/lib/thanks/constants'
import { thanksClaimUrl } from '@/lib/thanks/urls'
import type { PreviewDisposition } from '@/lib/thanks/eligibility'

export interface ThanksPromo {
  id: string
  code: string
  label: string | null
  grants_tier: string
  active: boolean
  redemption_count: number
}

export interface ThanksInvite {
  id: string
  email: string
  first_name: string | null
  status: ThanksInviteStatus | string
  token: string
  cadence_step: ThanksCadenceStep | string
  expires_at: string
  next_send_at: string | null
  last_sent_at: string | null
  sent_at: string | null
  redeemed_at: string | null
  stopped_reason: string | null
  delivered_count: number | null
  opened_at: string | null
  batch_id: string | null
  created_at: string
}

export interface ThanksNudge {
  id: string
  invite_id: string
  cadence_step: string
  due_at: string
  status: string
  created_at: string
  community_thanks_invites?: {
    email: string
    first_name: string | null
    token: string
    status: string
  } | null
}

type PreviewRow = {
  email: string
  firstName: string
  disposition: PreviewDisposition
  reason: string
}

const NAVY = 'var(--admin-text-strong)'
const SLATE = 'var(--admin-text-2)'
const TEAL = '#68a2b9'
const BLUE = '#1b3c5a'
const RED = '#ef0e30'

function fmtDate(iso: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    pending: { bg: 'rgba(104,162,185,0.12)', fg: TEAL, label: 'Pending' },
    sent: { bg: 'rgba(27,60,90,0.1)', fg: BLUE, label: 'Sent' },
    redeemed: { bg: 'rgba(34,197,94,0.1)', fg: '#15803d', label: 'Redeemed' },
    stopped: { bg: 'rgba(239,14,48,0.08)', fg: RED, label: 'Stopped' },
    expired: { bg: 'rgba(17,37,53,0.08)', fg: SLATE, label: 'Expired' },
    pending_approval: { bg: 'rgba(201,168,76,0.15)', fg: '#a07c1e', label: 'Needs YES' },
  }
  const style = map[status] ?? { bg: 'rgba(17,37,53,0.08)', fg: SLATE, label: status }
  return (
    <span
      className="font-condensed font-bold uppercase tracking-[0.1em] text-[10px] px-2 py-0.5 rounded"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {style.label}
    </span>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg px-5 py-4 bg-[var(--admin-card)]" style={{ border: '1px solid var(--admin-border)' }}>
      <p className="font-display font-black text-[26px]" style={{ color: NAVY }}>{value}</p>
      <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mt-0.5" style={{ color: SLATE }}>
        {label}
      </p>
    </div>
  )
}

export function ThanksClient({
  code,
  invites: initialInvites,
  queue: initialQueue,
  counts: initialCounts,
  wwwOrigin,
}: {
  code: ThanksPromo | null
  invites: ThanksInvite[]
  queue: ThanksNudge[]
  counts: ThanksAdminCounts
  wwwOrigin: string
}) {
  const [invites, setInvites] = useState(initialInvites)
  const [queue, setQueue] = useState(initialQueue)
  const [counts, setCounts] = useState(initialCounts)
  const [composer, setComposer] = useState('')
  const [fogOverride, setFogOverride] = useState(false)
  const [fogReason, setFogReason] = useState('')
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { confirm, dialog } = useConfirmDialog()

  const inviteableCount = useMemo(
    () => (preview ?? []).filter(r => r.disposition === 'invite').length,
    [preview],
  )

  function claimLink(token: string) {
    return thanksClaimUrl(token, wwwOrigin)
  }

  async function copyLink(token: string, id: string) {
    const url = claimLink(token)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(c => (c === id ? null : c)), 1600)
    } catch {
      window.prompt('Copy this Community invite link:', url)
    }
  }

  async function runPreview() {
    if (!composer.trim() || busy) return
    setBusy(true)
    setMsg(null)
    setErr(null)
    try {
      const res = await fetch('/api/admin/thanks/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw: composer,
          fogOverride,
          fogOverrideReason: fogReason,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        rows?: PreviewRow[]
        error?: string
      }
      if (!res.ok || !data.ok) {
        setErr(data.error ?? 'Could not preview.')
        return
      }
      setPreview(data.rows ?? [])
    } catch {
      setErr('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function runBatch(sendD0: boolean) {
    if (!composer.trim() || busy) return
    const ok = await confirm(sendD0 ? CONFIRM.sendThanksD0(inviteableCount || 'the previewed') : CONFIRM.queueThanksD0(inviteableCount || 'the previewed'))
    if (!ok) return
    setBusy(true)
    setMsg(null)
    setErr(null)
    try {
      const res = await fetch('/api/admin/thanks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw: composer,
          confirm: 'YES',
          sendD0,
          fogOverride,
          fogOverrideReason: fogReason,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        created?: number
        delivered?: number
        queued?: number
        error?: string
        rows?: Array<{ id: string; email: string; token: string; status: string; delivered: boolean }>
      }
      if (!res.ok || !data.ok) {
        setErr(data.error ?? 'Could not create invites.')
        return
      }
      if (data.rows?.length) {
        setInvites(prev => {
          const extra: ThanksInvite[] = data.rows!.filter(r => r.id).map(r => ({
            id: r.id,
            email: r.email,
            first_name: null,
            status: r.status,
            token: r.token,
            cadence_step: 'd0',
            expires_at: '',
            next_send_at: null,
            last_sent_at: sendD0 ? new Date().toISOString() : null,
            sent_at: sendD0 ? new Date().toISOString() : null,
            redeemed_at: null,
            stopped_reason: null,
            delivered_count: r.delivered ? 1 : 0,
            opened_at: null,
            batch_id: null,
            created_at: new Date().toISOString(),
          }))
          return [...extra, ...prev]
        })
        setCounts(c => ({
          ...c,
          invited: c.invited + (data.created ?? 0),
          delivered: c.delivered + (data.delivered ?? 0),
        }))
      }
      const parts = [`${data.created ?? 0} created`]
      if (sendD0) parts.push(`${data.delivered ?? 0} emailed`)
      else parts.push(`${data.queued ?? 0} queued (no send)`)
      setMsg(parts.join(' · ') + '. Copy link is always available.')
      setComposer('')
      setPreview(null)
    } catch {
      setErr('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function sendQueue(ids: string[]) {
    if (ids.length === 0 || busy) return
    const ok = await confirm(CONFIRM.sendThanksNudge(ids.length))
    if (!ok) return
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/admin/thanks/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'YES', queueIds: ids }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; delivered?: number; error?: string }
      if (!res.ok || !data.ok) {
        setErr(data.error ?? 'Could not send.')
        return
      }
      setQueue(prev => prev.filter(q => !ids.includes(q.id)))
      setMsg(`${data.delivered ?? 0} emailed. Copy link remains the fallback.`)
    } catch {
      setErr('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function enqueueDue() {
    if (busy) return
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/admin/thanks/nudge-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enqueue' }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        queued?: number
        expired?: number
        sent?: number
        error?: string
      }
      if (!res.ok || !data.ok) {
        setErr(data.error ?? 'Could not queue nudges.')
        return
      }
      if (data.sent && data.sent > 0) {
        setErr('Sweep tried to send. That is a bug. Nothing further was done.')
        return
      }
      const qRes = await fetch('/api/admin/thanks/nudge-queue')
      const qData = (await qRes.json().catch(() => ({}))) as { rows?: ThanksNudge[] }
      if (qData.rows) setQueue(qData.rows)
      setMsg(`${data.queued ?? 0} queued for YES. ${data.expired ?? 0} expired. Sent: 0.`)
    } catch {
      setErr('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const btnBase =
    'font-condensed font-bold uppercase tracking-[0.1em] text-[11px] rounded px-3 py-1.5 transition-all'

  return (
    <div className="space-y-6">
      {dialog}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-4">
        <div className="rounded-lg p-5 bg-[var(--admin-card)]" style={{ border: '1px solid var(--admin-border)' }}>
          <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px]" style={{ color: SLATE }}>
            Promo
          </p>
          <p className="font-display font-black text-[22px] tracking-[0.02em]" style={{ color: NAVY }}>
            {code?.code ?? 'THANKS_COMMUNITY'}
          </p>
          <p className="font-condensed text-[12px] mt-0.5" style={{ color: SLATE }}>
            Grants Community · no Stripe · not Friends of George
          </p>
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <span className="font-display font-black text-[26px]" style={{ color: NAVY }}>
              {code?.redemption_count ?? 0}
            </span>
            <span className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] ml-2" style={{ color: SLATE }}>
              redemptions
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Stat label="Invited" value={counts.invited} />
          <Stat label="Delivered" value={counts.delivered} />
          <Stat label="Redeemed" value={counts.redeemed} />
          <Stat label="Stopped" value={counts.stopped} />
          <Stat label="Expired" value={counts.expired} />
        </div>
      </div>
      <p className="font-condensed text-[12px]" style={{ color: SLATE }}>
        Opens: {counts.opensAvailable ? counts.opens : 'not wired (no Resend open webhook yet)'}
      </p>

      <div className="rounded-lg p-5 bg-[var(--admin-card)]" style={{ border: '1px solid var(--admin-border)' }}>
        <p className="font-display font-bold text-[16px]" style={{ color: NAVY }}>Batch invite</p>
        <p className="font-condensed text-[12px] mt-0.5 mb-3" style={{ color: SLATE }}>
          Paste emails or a CSV. Preview first. YES creates D0 only. Nothing sends without YES.
          Friends of George pending or redeemed addresses stay out unless you override with a reason.
        </p>
        <textarea
          value={composer}
          onChange={e => {
            setComposer(e.target.value)
            setPreview(null)
          }}
          placeholder="alex@example.com, sam@example.com"
          rows={4}
          className="w-full rounded-lg px-3 py-2.5 font-body text-[14px] outline-none"
          style={{ border: '1px solid rgba(17,37,53,0.15)', color: NAVY }}
        />
        <label className="flex items-start gap-2 mt-3 font-condensed text-[12px]" style={{ color: SLATE }}>
          <input
            type="checkbox"
            checked={fogOverride}
            onChange={e => setFogOverride(e.target.checked)}
          />
          <span>Admin override for Friends of George pending or redeemed (reason required)</span>
        </label>
        {fogOverride && (
          <input
            value={fogReason}
            onChange={e => setFogReason(e.target.value)}
            placeholder="Why this FOG address should get a Community thank-you"
            className="w-full mt-2 rounded-lg px-3 py-2 font-body text-[14px] outline-none"
            style={{ border: '1px solid rgba(17,37,53,0.15)', color: NAVY }}
          />
        )}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => void runPreview()}
            disabled={busy || !composer.trim()}
            className={btnBase}
            style={{ border: `1px solid ${TEAL}`, color: TEAL, opacity: busy || !composer.trim() ? 0.55 : 1 }}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => void runBatch(false)}
            disabled={busy || !composer.trim()}
            className={btnBase}
            style={{ border: `1px solid ${BLUE}`, color: BLUE, opacity: busy || !composer.trim() ? 0.55 : 1 }}
          >
            Queue D0 (no send)
          </button>
          <button
            type="button"
            onClick={() => void runBatch(true)}
            disabled={busy || !composer.trim()}
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px] rounded px-4 py-2"
            style={{ backgroundColor: BLUE, color: 'white', opacity: busy || !composer.trim() ? 0.55 : 1 }}
          >
            YES send D0
          </button>
        </div>
        {msg && <p className="font-condensed text-[12px] mt-3" style={{ color: '#15803d' }}>{msg}</p>}
        {err && <p className="font-condensed text-[12px] mt-3" style={{ color: RED }}>{err}</p>}

        {preview && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                  {['Email', 'Name', 'Disposition', 'Reason'].map(h => (
                    <th key={h} className="text-left font-condensed font-bold uppercase tracking-[0.12em] text-[10px] px-3 py-2" style={{ color: SLATE }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map(row => (
                  <tr key={`${row.email}-${row.disposition}`} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <td className="px-3 py-2 font-body text-[13px]" style={{ color: NAVY }}>{row.email}</td>
                    <td className="px-3 py-2 font-body text-[13px]" style={{ color: SLATE }}>{row.firstName || '-'}</td>
                    <td className="px-3 py-2"><StatusPill status={row.disposition === 'invite' ? 'pending' : row.disposition} /></td>
                    <td className="px-3 py-2 font-condensed text-[12px]" style={{ color: SLATE }}>{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="font-condensed text-[12px] mt-2" style={{ color: SLATE }}>
              {inviteableCount} ready for D0. Already paid, already members, FOG, and invalids stay out.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg p-5 bg-[var(--admin-card)]" style={{ border: '1px solid var(--admin-border)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <p className="font-display font-bold text-[16px]" style={{ color: NAVY }}>Nudge queue</p>
            <p className="font-condensed text-[12px]" style={{ color: SLATE }}>
              Due D7 / D14 / D28 land here as pending approval. Sweep never sends.
            </p>
          </div>
          <button type="button" onClick={() => void enqueueDue()} disabled={busy} className={btnBase} style={{ border: `1px solid ${TEAL}`, color: TEAL }}>
            Queue due nudges
          </button>
        </div>
        {queue.length === 0 ? (
          <p className="font-body text-[13px]" style={{ color: SLATE }}>No nudges waiting for YES.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                  {['Email', 'Step', 'Due', ''].map((h, i) => (
                    <th key={h || 'q-actions'} className="text-left font-condensed font-bold uppercase tracking-[0.12em] text-[10px] px-3 py-2" style={{ color: SLATE, textAlign: i === 3 ? 'right' : 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queue.map(row => {
                  const email = row.community_thanks_invites?.email ?? row.invite_id
                  const token = row.community_thanks_invites?.token
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                      <td className="px-3 py-2 font-body text-[13px]" style={{ color: NAVY }}>{email}</td>
                      <td className="px-3 py-2"><StatusPill status="pending_approval" /> <span className="font-condensed text-[11px] ml-1" style={{ color: SLATE }}>{row.cadence_step}</span></td>
                      <td className="px-3 py-2 font-condensed text-[12px]" style={{ color: SLATE }}>{fmtDate(row.due_at)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          {token && (
                            <button type="button" onClick={() => void copyLink(token, row.id)} className={btnBase} style={{ border: `1px solid ${TEAL}`, color: TEAL }}>
                              {copiedId === row.id ? 'Copied' : 'Copy link'}
                            </button>
                          )}
                          <button type="button" onClick={() => void sendQueue([row.id])} className={btnBase} style={{ backgroundColor: BLUE, color: 'white' }}>
                            YES send
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-[var(--admin-card)] overflow-hidden" style={{ border: '1px solid var(--admin-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                {['Email', 'Status', 'Step', 'Delivered', 'Redeemed', ''].map((h, i) => (
                  <th
                    key={h || 'actions'}
                    className="text-left font-condensed font-bold uppercase tracking-[0.12em] text-[10px] px-4 py-3"
                    style={{ color: SLATE, textAlign: i === 5 ? 'right' : 'left' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-body text-[13px]" style={{ color: SLATE }}>
                    No thank-you Community invites yet. Preview a list above. Do not invent addresses.
                  </td>
                </tr>
              ) : (
                invites.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <td className="px-4 py-3 font-body text-[13px]" style={{ color: NAVY }}>{row.email}</td>
                    <td className="px-4 py-3"><StatusPill status={row.status} /></td>
                    <td className="px-4 py-3 font-condensed text-[12px]" style={{ color: SLATE }}>{row.cadence_step}</td>
                    <td className="px-4 py-3 font-condensed text-[12px]" style={{ color: SLATE }}>{row.delivered_count ?? 0}</td>
                    <td className="px-4 py-3 font-condensed text-[12px]" style={{ color: SLATE }}>{fmtDate(row.redeemed_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void copyLink(row.token, row.id)}
                          className={btnBase}
                          style={{ border: `1px solid ${TEAL}`, color: TEAL }}
                        >
                          {copiedId === row.id ? 'Copied' : 'Copy link'}
                        </button>
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
