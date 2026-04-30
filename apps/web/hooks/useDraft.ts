'use client'

import { useEffect, useRef } from 'react'

const PREFIX = 'ep:draft:'

/** Synchronous read — call inside useState initialiser to hydrate a draft. */
export function loadDraft<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/** Remove a draft (e.g. after successful submit). */
export function clearDraft(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    /* quota / private-mode — just give up */
  }
}

interface UseDraftAutosaveOptions<T> {
  /** When true, the entry is removed from storage instead of written. */
  isEmpty?: (value: T) => boolean
  /** Debounce window for writes. Default 400ms. */
  debounceMs?: number
}

/**
 * Persists `value` to localStorage on change, debounced. Pair with
 * loadDraft() in a useState initialiser to round-trip drafts through
 * navigation and refresh.
 */
export function useDraftAutosave<T>(
  key: string,
  value: T,
  options?: UseDraftAutosaveOptions<T>,
): void {
  const debounce = options?.debounceMs ?? 400
  const isEmpty = options?.isEmpty
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      try {
        if (isEmpty && isEmpty(value)) {
          window.localStorage.removeItem(PREFIX + key)
        } else {
          window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
        }
      } catch {
        /* quota / private-mode — drop silently */
      }
    }, debounce)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [key, value, debounce, isEmpty])
}
