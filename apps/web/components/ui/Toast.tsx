'use client'

import { useEffect, useState } from 'react'
import type { Toast, ToastVariant } from '@/lib/toast'

const VARIANT_STYLES: Record<ToastVariant, { border: string; icon: string }> = {
  success: { border: '#0ABFA3', icon: '✓' },
  error:   { border: '#C9302A', icon: '✕' },
  info:    { border: '#C9A84C', icon: 'ℹ' },
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false)
  const { border, icon } = VARIANT_STYLES[toast.variant]

  useEffect(() => {
    // Trigger slide-in on mount
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className="pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 shadow-xl"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${border}`,
        minWidth: '260px',
        maxWidth: '360px',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.25s',
      }}
      role="alert"
    >
      {/* Variant icon */}
      <span
        className="flex-shrink-0 text-xs font-bold font-condensed leading-none mt-0.5"
        style={{ color: border }}
      >
        {icon}
      </span>

      {/* Message */}
      <p className="flex-1 font-body text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>
        {toast.message}
      </p>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 transition-colors leading-none"
        style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
