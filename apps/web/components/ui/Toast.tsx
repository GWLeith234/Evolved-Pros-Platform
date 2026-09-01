'use client'

import { useEffect, useState } from 'react'
import type { Toast, ToastVariant } from '@/lib/toast'

const VARIANT_STYLES: Record<
  ToastVariant,
  { border: string; icon: string; bg: string }
> = {
  success: {
    border: 'var(--brand-teal, #0ABFA3)',
    icon: '✓',
    bg: 'rgba(10,191,163,0.08)',
  },
  error: {
    border: 'var(--brand-red, #C9302A)',
    icon: '✕',
    bg: 'rgba(201,48,42,0.08)',
  },
  info: {
    border: 'var(--brand-gold, #C9A84C)',
    icon: 'ℹ',
    bg: 'rgba(201,168,76,0.08)',
  },
  warning: {
    border: '#F59E0B',
    icon: '!',
    bg: 'rgba(245,158,11,0.10)',
  },
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
  onPause: () => void
  onResume: () => void
}

export function ToastItem({ toast, onDismiss, onPause, onResume }: ToastItemProps) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const { border, icon, bg } = VARIANT_STYLES[toast.variant]
  const isAlert = toast.variant === 'error' || toast.variant === 'warning'

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  function handleDismiss() {
    setLeaving(true)
    window.setTimeout(() => onDismiss(toast.id), 180)
  }

  return (
    <div
      className={`ep-toast ep-toast--${toast.variant}${visible && !leaving ? ' ep-toast--in' : ''}${leaving ? ' ep-toast--out' : ''}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${border}`,
        boxShadow: 'var(--shadow-md)',
      }}
      role={isAlert ? 'alert' : 'status'}
      aria-live={isAlert ? 'assertive' : 'polite'}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onFocus={onPause}
      onBlur={onResume}
    >
      <span
        className="ep-toast__icon"
        style={{ color: border, background: bg }}
        aria-hidden="true"
      >
        {icon}
      </span>

      <div className="ep-toast__body">
        {toast.title && (
          <p className="ep-toast__title" style={{ color: 'var(--text-primary)' }}>
            {toast.title}
          </p>
        )}
        <p className="ep-toast__message" style={{ color: 'var(--text-primary)' }}>
          {toast.message}
        </p>
        {toast.action && (
          <button
            type="button"
            className="ep-toast__action"
            style={{ color: border }}
            onClick={() => {
              toast.action?.onClick()
              handleDismiss()
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="ep-toast__dismiss"
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {toast.duration > 0 && (
        <span
          className="ep-toast__timer"
          style={{
            background: border,
            // CSS animation duration mirrors auto-dismiss.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...({ ['--toast-ms']: `${toast.duration}ms` } as any),
          }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
