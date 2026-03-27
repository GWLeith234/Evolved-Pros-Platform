'use client'

import { useEffect, useState } from 'react'

export function DmUnreadBadge() {
  const [count, setCount] = useState(0)

  async function fetchCount() {
    try {
      const res = await fetch('/api/conversations/unread-count')
      if (res.ok) {
        const data = await res.json()
        setCount(data.count ?? 0)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchCount()

    function handleUnreadChanged() {
      fetchCount()
    }

    window.addEventListener('dm-unread-changed', handleUnreadChanged)
    return () => window.removeEventListener('dm-unread-changed', handleUnreadChanged)
  }, [])

  if (count <= 0) return null

  return (
    <span
      className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full font-condensed font-bold text-[9px] text-white flex items-center justify-center"
      style={{ backgroundColor: '#ef0e30' }}
    >
      {count}
    </span>
  )
}
