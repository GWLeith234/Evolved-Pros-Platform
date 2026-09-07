'use client'

import React, { useCallback, useEffect, useId, useRef } from 'react'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  consequence: string
  /** Substring of `consequence` rendered bold red. */
  emphasis?: string
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}

const FOCUSABLE = [
  'a[href]',
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

function ConsequenceLine({ text, emphasis }: { text: string; emphasis?: string }) {
  if (!emphasis) return <>{text}</>
  const idx = text.indexOf(emphasis)
  if (idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-bold text-red">{emphasis}</strong>
      {text.slice(idx + emphasis.length)}
    </>
  )
}

/**
 * M1 high-risk confirm shell. Sharp corners, parchment body, red header,
 * ghost Cancel left of red Confirm. No drop shadows.
 */
export function ConfirmDialog({
  open,
  title,
  consequence,
  emphasis,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descId = useId()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!dialogRef.current) return
      if (e.key === 'Escape' && !busy) {
        e.stopPropagation()
        onCancel()
        return
      }
      if (e.key !== 'Tab') return
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
      } else if (active === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [busy, onCancel],
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

  return (
    <div
      role="presentation"
      data-testid="confirm-dialog-backdrop"
      onMouseDown={e => {
        if (!busy && e.target === e.currentTarget) onCancel()
      }}
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-navy/70 p-4"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        data-testid="confirm-dialog"
        className="w-full max-w-[440px] overflow-hidden bg-paper outline-none"
      >
        <div
          data-testid="confirm-dialog-header"
          className="bg-red px-5 py-2.5 font-condensed text-[12px] font-bold uppercase tracking-[0.16em] text-white"
        >
          Confirm action
        </div>
        <div className="px-6 pb-5 pt-5">
          <h2
            id={titleId}
            className="font-display text-[22px] font-bold leading-tight text-navy"
          >
            {title}
          </h2>
          <p
            id={descId}
            className="mt-3 border-l-[3px] border-red pl-3 font-body text-[14px] leading-snug text-navy"
          >
            <ConsequenceLine text={consequence} emphasis={emphasis} />
          </p>
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              data-testid="confirm-dialog-cancel"
              className="border border-navy bg-white px-5 py-2 font-condensed text-[12px] font-bold uppercase tracking-[0.12em] text-navy disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              data-testid="confirm-dialog-confirm"
              className="bg-red px-5 py-2 font-condensed text-[12px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
            >
              {busy ? 'Working...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
