'use client'

import { useState, useEffect } from 'react'

export default function WeekLabel() {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    const now = new Date()
    const quarter = Math.ceil((now.getMonth() + 1) / 3)
    setLabel(
      `Week of ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — Q${quarter}`
    )
  }, [])

  if (!label) return null

  return (
    <p
      className="font-condensed font-bold uppercase tracking-widest"
      style={{ fontSize: '9px', color: '#c9a84c' }}
    >
      {label}
    </p>
  )
}
