'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface SyncResponse {
  inserted?: number
  linked?: number
  skipped?: number
  malformed?: number
  episodes?: string[]
  error?: string
}

export function SyncPodcastButton() {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)

  async function handleSync() {
    setSyncing(true)
    setStatus(null)
    try {
      const res = await fetch('/api/admin/podcast/sync', { method: 'POST' })
      const data = await res.json() as SyncResponse
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const inserted = data.inserted ?? 0
      const linked = data.linked ?? 0
      const skipped = data.skipped ?? 0
      const added = inserted + linked
      const message = added === 0
        ? `Up to date — ${skipped} already in sync`
        : `${added} draft episode${added === 1 ? '' : 's'} ready for review · ${skipped} already in sync`
      setStatus({ tone: 'success', message })
      // Refresh the server-rendered table so new rows appear.
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      setStatus({ tone: 'error', message })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        aria-busy={syncing}
        className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-5 py-2.5 transition-opacity"
        style={{
          backgroundColor: '#68a2b9',
          color: 'white',
          opacity: syncing ? 0.6 : 1,
          cursor: syncing ? 'not-allowed' : 'pointer',
        }}
      >
        {syncing ? 'Syncing…' : 'Sync Podcast'}
      </button>
      {status && (
        <p
          className="font-condensed text-[11px] tracking-wide"
          role="status"
          aria-live="polite"
          style={{
            color: status.tone === 'success' ? '#0f7a4f' : '#b91c1c',
            maxWidth: 280,
            textAlign: 'right',
          }}
        >
          {status.message}
        </p>
      )}
    </div>
  )
}
