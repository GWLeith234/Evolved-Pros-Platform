'use client'

import { useState, useEffect } from 'react'

interface GreetingHeadingProps {
  displayName: string
}

export function GreetingHeading({ displayName }: GreetingHeadingProps) {
  const [greeting, setGreeting] = useState<string>('')

  useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')
  }, [])

  if (!greeting) return null

  return (
    <h1 className="text-3xl font-bold text-white leading-tight">
      {greeting}, {displayName}.
    </h1>
  )
}
