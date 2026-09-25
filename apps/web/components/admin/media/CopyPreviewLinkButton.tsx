'use client'

import { useState } from 'react'

export function CopyPreviewLinkButton({ storyId }: { storyId: string }) {
  const [label, setLabel] = useState('Copy preview link')
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)

  async function onClick() {
    setError(null)
    setLabel('Copying...')
    try {
      const res = await fetch(`/api/admin/media/${storyId}/preview-link`, { method: 'POST' })
      const data = await res.json().catch(() => ({})) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error || 'Could not copy the preview link.')
        setLabel('Copy preview link')
        return
      }
      setUrl(data.url)
      try {
        await navigator.clipboard.writeText(data.url)
        setLabel('Copied')
      } catch {
        setLabel('Link ready')
      }
      window.setTimeout(() => setLabel('Copy preview link'), 2000)
    } catch {
      setError('Could not copy the preview link.')
      setLabel('Copy preview link')
    }
  }

  return (
    <div className="ep-preview-copy">
      <button type="button" onClick={() => void onClick()} className="ep-admin-el-btn">
        {label}
      </button>
      {error ? <p className="ep-preview-copy-error" role="alert">{error}</p> : null}
      {url ? (
        <input
          readOnly
          value={url}
          aria-label="Preview link"
          className="ep-preview-copy-url"
          onFocus={event => event.currentTarget.select()}
        />
      ) : null}
    </div>
  )
}
