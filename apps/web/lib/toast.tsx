'use client'

/**
 * Sprint 3 — Toast / notification system.
 *
 * Imperative API via useToast():
 *   showToast('Saved')
 *   showToast('Failed', 'error')
 *   showToast({ message: 'Done', variant: 'success', duration: 5000, action: { label: 'Undo', onClick } })
 *
 * Provider mounts a fixed, mobile-safe, a11y-correct live region.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react'
import { ToastItem } from '@/components/ui/Toast'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  message: string
  title?: string
  variant: ToastVariant
  duration: number
  action?: ToastAction
}

export interface ShowToastOptions {
  message: string
  title?: string
  variant?: ToastVariant
  /** ms; 0 = sticky until dismissed. Default 3200 (error 5000). */
  duration?: number
  action?: ToastAction
}

type ShowToastInput = string | ShowToastOptions

interface ToastContextValue {
  showToast: (input: ShowToastInput, variant?: ToastVariant) => string
  dismissToast: (id: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const MAX_TOASTS = 4

function defaultDuration(variant: ToastVariant): number {
  if (variant === 'error') return 5000
  if (variant === 'warning') return 4200
  return 3200
}

function normalizeInput(input: ShowToastInput, variantArg?: ToastVariant): Omit<Toast, 'id'> {
  if (typeof input === 'string') {
    const variant = variantArg ?? 'success'
    return {
      message: input,
      variant,
      duration: defaultDuration(variant),
    }
  }
  const variant = input.variant ?? variantArg ?? 'success'
  return {
    message: input.message,
    title: input.title,
    variant,
    duration: input.duration ?? defaultDuration(variant),
    action: input.action,
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const clearTimer = useCallback((id: string) => {
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const dismissToast = useCallback((id: string) => {
    clearTimer(id)
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [clearTimer])

  const dismissAll = useCallback(() => {
    Object.keys(timers.current).forEach(clearTimer)
    setToasts([])
  }, [clearTimer])

  const scheduleDismiss = useCallback(
    (id: string, duration: number) => {
      clearTimer(id)
      if (duration <= 0) return
      timers.current[id] = setTimeout(() => dismissToast(id), duration)
    },
    [clearTimer, dismissToast],
  )

  const showToast = useCallback(
    (input: ShowToastInput, variant?: ToastVariant) => {
      const base = normalizeInput(input, variant)
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2, 11)
      const toast: Toast = { id, ...base }

      setToasts(prev => {
        const next = [...prev, toast]
        // Drop oldest when stack exceeds cap.
        if (next.length > MAX_TOASTS) {
          const dropped = next.slice(0, next.length - MAX_TOASTS)
          dropped.forEach(t => clearTimer(t.id))
          return next.slice(-MAX_TOASTS)
        }
        return next
      })

      scheduleDismiss(id, toast.duration)
      return id
    },
    [clearTimer, scheduleDismiss],
  )

  // Cleanup timers on unmount.
  useEffect(() => () => {
    Object.keys(timers.current).forEach(id => clearTimeout(timers.current[id]))
  }, [])

  const value: ToastContextValue = { showToast, dismissToast, dismissAll }

  const hasError = toasts.some(t => t.variant === 'error')

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="ep-toast-viewport"
        // Errors use assertive so AT users hear them immediately.
        aria-live={hasError ? 'assertive' : 'polite'}
        aria-relevant="additions text"
        aria-atomic="false"
      >
        {toasts.map(t => (
          <ToastItem
            key={t.id}
            toast={t}
            onDismiss={dismissToast}
            onPause={() => clearTimer(t.id)}
            onResume={() => scheduleDismiss(t.id, t.duration)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Soft no-op outside provider so isolated stories / tests don't crash.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[useToast] called outside ToastProvider — toasts are no-ops')
    }
    return {
      showToast: () => '',
      dismissToast: () => {},
      dismissAll: () => {},
    }
  }
  return ctx
}
