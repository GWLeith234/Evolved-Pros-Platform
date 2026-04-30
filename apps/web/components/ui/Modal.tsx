'use client'

import React, { useCallback, useEffect, useId, useRef } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  /** When false, clicking the backdrop does NOT close. Default true. */
  closeOnBackdropClick?: boolean
  /** When false, ESC does NOT close. Default true. */
  closeOnEsc?: boolean
  /** Optional max-width override (default 480) */
  maxWidth?: number
  ariaLabel?: string
  className?: string
  children: React.ReactNode
}

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    el => !el.hasAttribute('aria-hidden') && (el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement),
  )
}

export function Modal({
  open,
  onClose,
  title,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  maxWidth = 480,
  ariaLabel,
  className,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const titleId = useId()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!dialogRef.current) return
      if (e.key === 'Escape' && closeOnEsc) {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusables = getFocusable(dialogRef.current)
        if (focusables.length === 0) {
          e.preventDefault()
          dialogRef.current.focus()
          return
        }
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey) {
          if (active === first || !dialogRef.current.contains(active)) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (active === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [closeOnEsc, onClose],
  )

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = (document.activeElement as HTMLElement | null) ?? null
    const dialog = dialogRef.current
    if (dialog) {
      const focusables = getFocusable(dialog)
      ;(focusables[0] ?? dialog).focus({ preventScroll: true })
    }

    document.addEventListener('keydown', handleKeyDown, true)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.body.style.overflow = previousOverflow
      previouslyFocused.current?.focus?.({ preventScroll: true })
    }
  }, [open, handleKeyDown])

  if (!open) return null

  const labelledBy = title ? titleId : undefined
  const ariaProps = labelledBy
    ? { 'aria-labelledby': labelledBy }
    : ariaLabel
    ? { 'aria-label': ariaLabel }
    : {}

  return (
    <div
      role="presentation"
      onMouseDown={e => {
        if (closeOnBackdropClick && e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={className}
        {...ariaProps}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflow: 'auto',
          background: '#fff',
          borderRadius: 8,
          outline: 'none',
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        }}
      >
        {title && (
          <div
            id={titleId}
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(27,60,90,0.08)',
              fontFamily: 'Georgia, serif',
              fontWeight: 600,
              fontSize: 15,
              color: 'rgba(27,60,90,0.95)',
            }}
          >
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
