'use client'

import { useState } from 'react'
import { FIT_FEATURED_EYEBROW } from '@/lib/fit/copy'
import type { FitMove } from '@/lib/fit/moves'
import { FitTeaseCard } from '@/components/fit/FitTeaseCard'

export function FitTeaseRotator({
  moves,
  locked,
  eyebrow = FIT_FEATURED_EYEBROW,
}: {
  moves: FitMove[]
  locked: boolean
  eyebrow?: string
}) {
  const [index, setIndex] = useState(0)
  const move = moves[index] ?? moves[0]
  if (!move) return null

  return (
    <FitTeaseCard
      move={move}
      locked={locked}
      index={index}
      total={moves.length}
      eyebrow={eyebrow}
      onNext={() => setIndex(i => (i + 1) % moves.length)}
    />
  )
}
