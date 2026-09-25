'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Scrolls the active global-nav tab into the visible row. At 390px the
 * list overflows and MEDIA (the current tab on /media and articles) is
 * clipped to "ME…" at the right edge. The list is the only scroller, so
 * the page itself does not jump, and a row that already fits is left alone.
 */
export function GlobalNavList({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const list = ref.current
    const active = list?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!list || !active) return
    const listRect = list.getBoundingClientRect()
    const activeRect = active.getBoundingClientRect()
    const clipped =
      activeRect.left < listRect.left - 1 || activeRect.right > listRect.right + 1
    if (!clipped) return
    const delta =
      activeRect.left - listRect.left - (listRect.width - activeRect.width) / 2
    list.scrollTo({ left: Math.max(0, list.scrollLeft + delta) })
  }, [])

  return (
    <ul ref={ref} className="ep-global-nav-list">
      {children}
    </ul>
  )
}
