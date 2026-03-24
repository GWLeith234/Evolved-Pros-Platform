'use client'

import { useState } from 'react'
import { PipelineCard } from './PipelineCard'
import type { PipelineMemberCard } from './PipelineCard'

type PipelineStage = 'awareness' | 'engaged' | 'upgrade_ready' | 'closed'

interface PipelineData {
  awareness:     PipelineMemberCard[]
  engaged:       PipelineMemberCard[]
  upgrade_ready: PipelineMemberCard[]
  closed:        PipelineMemberCard[]
}

const COLUMNS: { stage: PipelineStage; label: string; desc: string }[] = [
  { stage: 'awareness',     label: 'Awareness',      desc: 'Low activity, new members' },
  { stage: 'engaged',       label: 'Engaged',        desc: 'Active community members' },
  { stage: 'upgrade_ready', label: 'Upgrade Ready',  desc: 'Hit Pillar 4 or activity spike' },
  { stage: 'closed',        label: 'Closed',         desc: 'Upgraded to Pro this month' },
]

export function PipelineBoard({ initialData }: { initialData: PipelineData }) {
  const [data, setData] = useState<PipelineData>(initialData)
  const [dragging, setDragging] = useState<{ member: PipelineMemberCard; fromStage: PipelineStage } | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  function handleDragStart(member: PipelineMemberCard, fromStage: PipelineStage) {
    setDragging({ member, fromStage })
  }

  async function handleDrop(toStage: PipelineStage) {
    if (!dragging || dragging.fromStage === toStage) {
      setDragging(null)
      return
    }

    const { member, fromStage } = dragging
    setDragging(null)

    // Optimistic update
    setData(prev => {
      const next = { ...prev }
      next[fromStage] = next[fromStage].filter(m => m.id !== member.id)
      next[toStage]   = [{ ...member, stage: toStage, overridden: true }, ...next[toStage]]
      return next
    })

    // Persist override
    setSavingId(member.id)
    try {
      await fetch('/api/admin/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.id, stage: toStage }),
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="grid grid-cols-4 gap-4 min-h-[400px]">
      {COLUMNS.map(col => {
        const members = data[col.stage]
        const isOver  = dragging !== null

        return (
          <div
            key={col.stage}
            className="flex flex-col rounded-lg overflow-hidden"
            style={{ border: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.02)' }}
            onDragOver={e => e.preventDefault()}
            onDrop={() => void handleDrop(col.stage)}
          >
            {/* Column header */}
            <div
              className="px-4 py-3 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(27,60,90,0.08)', backgroundColor: 'rgba(27,60,90,0.04)' }}
            >
              <div>
                <p className="font-condensed font-bold uppercase tracking-[0.16em] text-[9px] text-[#7a8a96]">
                  {col.label}
                </p>
                <p className="font-condensed text-[10px] text-[#7a8a96] mt-0.5">{col.desc}</p>
              </div>
              <span
                className="font-condensed font-bold text-[12px] px-2 py-0.5 rounded min-w-[24px] text-center"
                style={{ backgroundColor: 'rgba(27,60,90,0.08)', color: '#1b3c5a' }}
              >
                {members.length}
              </span>
            </div>

            {/* Cards */}
            <div
              className="flex-1 p-3 overflow-y-auto transition-colors"
              style={{ minHeight: '200px', backgroundColor: isOver ? 'rgba(104,162,185,0.04)' : 'transparent' }}
            >
              {members.length === 0 ? (
                <p className="font-condensed text-[10px] text-[#7a8a96] text-center mt-4">
                  Drop cards here
                </p>
              ) : (
                members.map(m => (
                  <div
                    key={m.id}
                    draggable
                    onDragStart={() => handleDragStart(m, col.stage)}
                    className="cursor-grab active:cursor-grabbing"
                    style={{ opacity: savingId === m.id ? 0.5 : 1 }}
                  >
                    <PipelineCard
                      member={m}
                      isUpgradeReady={col.stage === 'upgrade_ready'}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
