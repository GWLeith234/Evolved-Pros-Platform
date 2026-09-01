'use client'

export interface PipelineMemberCard {
  id: string
  displayName: string | null
  fullName: string | null
  tier: string | null
  tierStatus: string | null
  stage: string
  stageNote: string
  estimatedValue: number
  engagementLevel: string
  overridden: boolean
}

interface PipelineCardProps {
  member: PipelineMemberCard
  isUpgradeReady?: boolean
}

export function PipelineCard({ member, isUpgradeReady = false }: PipelineCardProps) {
  const name = member.displayName ?? member.fullName ?? 'Member'
  const stageContext = member.tier === 'pro' ? 'Core → Pro' : 'Trial → Core'

  return (
    <div
      className="rounded p-3 mb-2 transition-all cursor-default"
      style={{
        backgroundColor: 'var(--admin-card)',
        border: `1px solid ${isUpgradeReady ? '#c9a84c' : 'rgba(27,60,90,0.1)'}`,
        borderLeft: isUpgradeReady ? '3px solid #c9a84c' : '1px solid rgba(27,60,90,0.1)',
      }}
    >
      <p className="font-body font-semibold text-[13px] text-[color:var(--admin-text)] mb-0.5">{name}</p>
      <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mb-1.5">{stageContext}</p>

      {member.stageNote && (
        <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mb-1.5">{member.stageNote}</p>
      )}

      <div className="flex items-center justify-between">
        {member.estimatedValue > 0 ? (
          <span
            className="font-condensed font-bold text-[12px]"
            style={{ color: 'var(--admin-text-strong)' }}
          >
            ${member.estimatedValue.toLocaleString('en-US')}/yr
          </span>
        ) : (
          <span className="font-condensed text-[12px] text-[color:var(--admin-text-2)]">—</span>
        )}
        {member.overridden && (
          <span
            className="font-condensed font-bold uppercase text-[8px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'rgba(104,162,185,0.1)', color: '#68a2b9' }}
          >
            Override
          </span>
        )}
      </div>
    </div>
  )
}
