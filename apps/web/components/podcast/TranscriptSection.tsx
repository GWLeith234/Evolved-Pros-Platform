'use client'

import { useState } from 'react'

interface TranscriptSectionProps {
  transcript: string | null
}

export function TranscriptSection({ transcript }: TranscriptSectionProps) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.07)', backgroundColor: '#112535' }}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 transition-colors"
        style={{ backgroundColor: open ? 'rgba(255,255,255,0.03)' : 'transparent' }}
      >
        <span className="font-condensed font-bold uppercase tracking-[0.18em] text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Read Transcript
        </span>
        <span
          className="font-condensed text-[14px] transition-transform duration-200"
          style={{ color: 'rgba(255,255,255,0.4)', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          className="px-6 pb-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {transcript ? (
            <div
              className="font-body text-[14px] leading-[1.8] mt-4 whitespace-pre-wrap"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              {transcript}
            </div>
          ) : (
            <p className="font-condensed text-[12px] mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Transcript coming soon.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
