'use client'

import { useState } from 'react'
import { PILLAR_COLORS } from '@/types/habits'
import { CompoundBoardClient } from './CompoundBoardClient'

const PILLARS = Object.keys(PILLAR_COLORS)
const ALL_PILLS = ['All', ...PILLARS]

interface HabitsPageShellProps {
  userId: string
}

export function HabitsPageShell({ userId }: HabitsPageShellProps) {
  const [activePillar, setActivePillar] = useState<string>('All')

  return (
    <>
      {/* Parchment header — matches Community + Podcast pattern */}
      <div
        className="px-4 md:px-8 py-6"
        style={{ backgroundColor: '#F5F0E8', borderBottom: '1px solid rgba(27,42,74,0.1)' }}
      >
        <p
          className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] mb-1"
          style={{ color: '#C9302A' }}
        >
          EVOLVED PROS
        </p>

        <h1
          className="font-display font-black leading-tight mb-1"
          style={{ fontSize: '28px', color: '#1B2A4A' }}
        >
          Discipline
        </h1>

        <p
          className="font-body text-[14px] mb-4"
          style={{ color: '#6B7A8D', maxWidth: '540px' }}
        >
          Build winning daily habits across all 6 EVOLVED pillars. Small actions, compounded daily.
        </p>

        {/* Pillar filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ALL_PILLS.map(pill => {
            const active = activePillar === pill
            return (
              <button
                key={pill}
                type="button"
                onClick={() => setActivePillar(pill)}
                className="font-condensed font-semibold uppercase tracking-[0.1em] text-[10px] transition-all"
                style={{
                  padding:         '5px 14px',
                  borderRadius:    '20px',
                  backgroundColor: active ? '#1B2A4A' : '#ffffff',
                  color:           active ? '#ffffff' : '#1B2A4A',
                  border:          `1px solid ${active ? '#1B2A4A' : 'rgba(27,42,74,0.15)'}`,
                }}
              >
                {pill}
              </button>
            )
          })}
        </div>
      </div>

      {/* Dark content area */}
      <CompoundBoardClient
        userId={userId}
        activePillar={activePillar === 'All' ? undefined : activePillar}
      />
    </>
  )
}
