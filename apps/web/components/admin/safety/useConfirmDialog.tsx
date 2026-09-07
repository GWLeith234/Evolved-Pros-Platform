'use client'

import { useCallback, useRef, useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

export interface ConfirmRequest {
  title: string
  consequence: string
  emphasis?: string
  confirmLabel?: string
  cancelLabel?: string
}

/**
 * Promise-based M1 confirm. Call `confirm(req)` from a click handler;
 * render `{dialog}` once in the tree.
 */
export function useConfirmDialog() {
  const [open, setOpen] = useState(false)
  const [req, setReq] = useState<ConfirmRequest | null>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)

  const finish = useCallback((ok: boolean) => {
    setOpen(false)
    const resolve = resolver.current
    resolver.current = null
    resolve?.(ok)
  }, [])

  const confirm = useCallback((request: ConfirmRequest) => {
    if (resolver.current) resolver.current(false)
    setReq(request)
    setOpen(true)
    return new Promise<boolean>(resolve => {
      resolver.current = resolve
    })
  }, [])

  const dialog = (
    <ConfirmDialog
      open={open}
      title={req?.title ?? ''}
      consequence={req?.consequence ?? ''}
      emphasis={req?.emphasis}
      confirmLabel={req?.confirmLabel}
      cancelLabel={req?.cancelLabel}
      onCancel={() => finish(false)}
      onConfirm={() => finish(true)}
    />
  )

  return { confirm, dialog }
}
