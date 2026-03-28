'use client'

import { useState, useEffect } from 'react'
import { MemberBadge } from '@/components/ui/MemberBadge'

interface GreetingTextProps {
  firstName: string
  tier?: string | null
}

export function GreetingText({ firstName, tier }: GreetingTextProps) {
  const [greeting, setGreeting] = useState<string | null>(null)
  const [weekLabel, setWeekLabel] = useState<string | null>(null)

  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')

    const quarter = Math.ceil((now.getMonth() + 1) / 3)
    setWeekLabel(
      `Week of ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — Q${quarter}`
    )
  }, [])

  // Renders nothing on server — avoids SSR/client timezone hydration mismatch entirely
  if (!greeting) return null

  return (
    <>
      <p
        className="font-condensed font-bold uppercase tracking-[0.2em] mb-1"
        style={{ fontSize: '9px', color: '#c9a84c' }}
      >
        {weekLabel}
      </p>
      <h1
        className="font-display font-black text-white leading-tight flex items-center gap-3 flex-wrap"
        style={{ fontSize: '22px' }}
      >
        {greeting}, {firstName}.
        {tier && <MemberBadge tier={tier} size="md" />}
      </h1>
    </>
  )
}
