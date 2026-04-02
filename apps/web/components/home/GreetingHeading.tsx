'use client'

import { useState, useEffect } from 'react'

interface Props {
  displayName: string
}

export default function GreetingHeading({ displayName }: Props) {
  const [greeting, setGreeting] = useState<string | null>(null)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  // Returns null both on the server (never rendered — ssr:false) and
  // on the client before the useEffect fires. No tree mismatch possible.
  if (!greeting) return null

  return (
    <h1 className="text-3xl font-bold leading-tight" style={{ color: '#ffffff' }}>
      {greeting}, {displayName}.
    </h1>
  )
}
