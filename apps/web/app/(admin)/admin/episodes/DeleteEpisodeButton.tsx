'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteEpisodeButton({ episodeId, title }: { episodeId: string; title: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/episodes/${episodeId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Delete failed')
      }
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
      setDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="font-condensed font-semibold uppercase tracking-wide text-[10px] transition-colors disabled:opacity-50"
      style={{ color: '#ef0e30' }}
    >
      {deleting ? '…' : 'Delete'}
    </button>
  )
}
