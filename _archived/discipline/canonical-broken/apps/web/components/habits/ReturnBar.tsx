'use client'

interface ReturnBarProps {
  onDismiss: () => void
}

export function ReturnBar({ onDismiss }: ReturnBarProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderLeft: '3px solid #0ABFA3',
        border: '1px solid rgba(10,191,163,0.2)',
        borderLeftWidth: '3px',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ABFA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>

      <p
        className="flex-1 font-body"
        style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}
      >
        Welcome back — your streak reset. Start building again today.
      </p>

      <button
        type="button"
        onClick={onDismiss}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-opacity hover:opacity-70"
        style={{ color: 'rgba(255,255,255,0.3)' }}
        aria-label="Dismiss"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="2" y1="2" x2="10" y2="10" />
          <line x1="10" y1="2" x2="2" y2="10" />
        </svg>
      </button>
    </div>
  )
}
