'use client'

import { useState, type ReactNode } from 'react'

/** Width toggle for the unpublished-story index. Mobile locks the list to 390px. */
export function PreviewIndexFrame({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop')

  return (
    <div className="ep-preview-index-board">
      <div className="ep-preview-index-toggle" role="group" aria-label="Preview width">
        <button
          type="button"
          aria-pressed={mode === 'desktop'}
          onClick={() => setMode('desktop')}
        >
          Desktop
        </button>
        <button
          type="button"
          aria-pressed={mode === 'mobile'}
          onClick={() => setMode('mobile')}
        >
          Mobile
        </button>
      </div>
      <div className={mode === 'mobile' ? 'ep-preview-index-frame is-mobile' : 'ep-preview-index-frame'}>
        {children}
      </div>
    </div>
  )
}
