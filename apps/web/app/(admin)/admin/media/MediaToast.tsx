'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const MESSAGES: Record<string, string> = {
  saved:     'Draft saved',
  published: 'Story published — view on /media',
  deleted:   'Story deleted',
}

const COLORS: Record<string, { bg: string; fg: string }> = {
  saved:     { bg: 'rgba(10,191,163,0.12)',  fg: '#0ABFA3' },
  published: { bg: 'rgba(34,197,94,0.12)',   fg: '#16a34a' },
  deleted:   { bg: 'rgba(239,14,48,0.10)',   fg: '#ef0e30' },
}

export function MediaToast() {
  const router = useRouter()
  const params = useSearchParams()
  const toast = params.get('toast')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!toast || !MESSAGES[toast]) return
    setOpen(true)
    // Remove the query string from the URL so a refresh doesn't re-toast.
    router.replace('/admin/media', { scroll: false })
    const t = setTimeout(() => setOpen(false), 3500)
    return () => clearTimeout(t)
  }, [toast, router])

  if (!open || !toast || !MESSAGES[toast]) return null
  const palette = COLORS[toast] ?? COLORS.saved
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 px-4 py-3 rounded font-condensed font-semibold uppercase tracking-[0.14em] text-[12px]"
      style={{ backgroundColor: palette.bg, color: palette.fg, border: `1px solid ${palette.fg}33` }}
    >
      {MESSAGES[toast]}
    </div>
  )
}
