'use client'

import { useState } from 'react'
import { LessonNotes } from './LessonNotes'

type Tab = 'notes' | 'resources' | 'discussion'

interface LessonTabsProps {
  lessonId: string
  initialNotes: string
}

export function LessonTabs({ lessonId, initialNotes }: LessonTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('notes')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 mb-4" style={{ borderBottom: '1px solid rgba(27,60,90,0.1)' }}>
        {(['notes', 'resources', 'discussion'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[11px] px-0 pb-2 mr-5 transition-all"
            style={{
              color: activeTab === tab ? '#112535' : '#7a8a96',
              borderBottom: activeTab === tab ? '2px solid #ef0e30' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'notes' && (
        <LessonNotes lessonId={lessonId} initialNotes={initialNotes} />
      )}
      {activeTab === 'resources' && (
        <div
          className="rounded px-4 py-3"
          style={{ backgroundColor: 'rgba(27,60,90,0.03)', border: '1px solid rgba(27,60,90,0.1)' }}
        >
          <p className="font-condensed text-[12px]" style={{ color: '#7a8a96' }}>
            Resources coming soon.
          </p>
        </div>
      )}
      {activeTab === 'discussion' && (
        <div
          className="rounded px-4 py-3"
          style={{ backgroundColor: 'rgba(27,60,90,0.03)', border: '1px solid rgba(27,60,90,0.1)' }}
        >
          <p className="font-condensed text-[12px]" style={{ color: '#7a8a96' }}>
            Discussion coming soon — join the community channel for this pillar.
          </p>
        </div>
      )}
    </div>
  )
}
