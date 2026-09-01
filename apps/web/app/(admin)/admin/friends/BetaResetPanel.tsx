'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface SuspendedMember {
  id: string
  email: string | null
  full_name: string | null
  display_name: string | null
}

const RED = '#ef0e30'
const GREEN = '#0abfa3'

function nameOf(m: SuspendedMember): string {
  return m.display_name || m.full_name || m.email || m.id
}

// SPRINT Q — reversible beta reset. Pauses all non-admin, non-comped members
// (redirect to /beta-paused) and restores them with zero data loss. Counts +
// list are server truth (props); router.refresh() re-pulls after each action.
export function BetaResetPanel({
  initialActiveCount,
  initialSuspended,
}: {
  initialActiveCount: number
  initialSuspended: SuspendedMember[]
}) {
  const router = useRouter()
  const activeCount = initialActiveCount
  const suspended = initialSuspended
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function run(bodyObj: Record<string, unknown>, key: string, ok: (data: any) => string) {
    if (busy) return
    setBusy(key)
    setMsg(null)
    setErr(null)
    try {
      const res = await fetch('/api/admin/beta-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setErr(data.error ?? 'Something went wrong.')
        return
      }
      setMsg(ok(data))
      router.refresh()
    } catch {
      setErr('Network error — please try again.')
    } finally {
      setBusy(null)
    }
  }

  function pauseAll() {
    if (
      !window.confirm(
        `Pause access for ${activeCount} non-admin, non-comped member(s)?\n\n` +
          'Admins and comped Friends of George keep full access. No data is deleted — ' +
          'this is fully reversible with Restore.',
      )
    )
      return
    void run({ action: 'pause' }, 'pause', d => `Paused ${d.affected ?? 0} member(s).`)
  }

  function restoreAll() {
    if (!window.confirm(`Restore access for all ${suspended.length} suspended member(s)?`)) return
    void run({ action: 'restore-all' }, 'restore-all', d => `Restored ${d.restored ?? 0} member(s).`)
  }

  function restoreOne(m: SuspendedMember) {
    void run({ action: 'restore', userId: m.id }, m.id, () => `Restored ${nameOf(m)}.`)
  }

  const btn =
    'font-condensed font-bold uppercase tracking-[0.1em] text-[11px] rounded px-3 py-1.5 transition-all'

  return (
    <section
      className="rounded-lg p-5 bg-[var(--admin-card)]"
      style={{ border: '1px solid var(--admin-border)' }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p
            className="font-condensed font-bold uppercase tracking-[0.16em] text-[10px]"
            style={{ color: RED }}
          >
            Beta reset
          </p>
          <h2 className="font-display font-bold text-[18px]" style={{ color: 'var(--admin-text-strong)' }}>
            Pause all non-admin access
          </h2>
          <p className="font-condensed text-[12px] mt-0.5" style={{ color: 'var(--admin-text-2)' }}>
            Suspends every non-admin, non-comped member for the closed beta. Admins and comped
            Friends of George are never affected. Fully reversible — nothing is deleted.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="font-display font-black text-[22px]" style={{ color: 'var(--admin-text-strong)' }}>{activeCount}</p>
            <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[9px]" style={{ color: 'var(--admin-text-2)' }}>Active</p>
          </div>
          <div className="text-center">
            <p className="font-display font-black text-[22px]" style={{ color: RED }}>{suspended.length}</p>
            <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[9px]" style={{ color: 'var(--admin-text-2)' }}>Suspended</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <button
          type="button"
          onClick={pauseAll}
          disabled={busy != null || activeCount === 0}
          className={btn}
          style={{ backgroundColor: RED, color: '#fff', opacity: busy != null || activeCount === 0 ? 0.5 : 1 }}
        >
          {busy === 'pause' ? 'Pausing…' : `Pause all non-admin access`}
        </button>
        {suspended.length > 0 && (
          <button
            type="button"
            onClick={restoreAll}
            disabled={busy != null}
            className={btn}
            style={{ border: `1px solid ${GREEN}`, color: GREEN, opacity: busy != null ? 0.5 : 1 }}
          >
            {busy === 'restore-all' ? 'Restoring…' : 'Restore all'}
          </button>
        )}
        {msg && <span className="font-condensed text-[12px]" style={{ color: GREEN }}>{msg}</span>}
        {err && <span className="font-condensed text-[12px]" style={{ color: RED }}>{err}</span>}
      </div>

      {suspended.length > 0 && (
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--admin-border)' }}>
          <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-2" style={{ color: 'var(--admin-text-2)' }}>
            Suspended members
          </p>
          <ul className="space-y-1.5">
            {suspended.map(m => (
              <li key={m.id} className="flex items-center justify-between gap-3">
                <span className="font-body text-[13px] truncate" style={{ color: 'var(--admin-text)' }}>
                  {m.email ?? nameOf(m)}
                </span>
                <button
                  type="button"
                  onClick={() => restoreOne(m)}
                  disabled={busy != null}
                  className={btn}
                  style={{ border: `1px solid ${GREEN}`, color: GREEN, opacity: busy === m.id ? 0.5 : 1 }}
                >
                  {busy === m.id ? '…' : 'Restore'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
