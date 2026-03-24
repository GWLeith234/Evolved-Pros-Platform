import React from 'react'

type TierVariant    = { kind: 'tier';   tier: 'pro' | 'community' }
type StatusVariant  = { kind: 'status'; status: 'active' | 'trial' | 'cancelled' }
type PillarVariant  = { kind: 'pillar'; label: string }
type PlanVariant    = { kind: 'plan';   label: string }

type BadgeProps = (TierVariant | StatusVariant | PillarVariant | PlanVariant) & {
  className?: string
}

const tierStyles = {
  pro:       'bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/30',
  community: 'bg-[#68a2b9]/10 text-[#68a2b9] border border-[#68a2b9]/30',
}

const statusStyles = {
  active:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  trial:     'bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/30',
  cancelled: 'bg-[#ef0e30]/10 text-[#ef0e30] border border-[#ef0e30]/30',
}

export function Badge(props: BadgeProps) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-condensed font-semibold uppercase tracking-wide'

  if (props.kind === 'tier') {
    return (
      <span className={`${base} ${tierStyles[props.tier]} ${props.className ?? ''}`}>
        {props.tier === 'pro' ? 'Pro' : 'Community'}
      </span>
    )
  }

  if (props.kind === 'status') {
    return (
      <span className={`${base} ${statusStyles[props.status]} ${props.className ?? ''}`}>
        {props.status}
      </span>
    )
  }

  if (props.kind === 'pillar') {
    return (
      <span className={`${base} bg-[#68a2b9]/10 text-[#68a2b9] border border-[#68a2b9]/30 ${props.className ?? ''}`}>
        {props.label}
      </span>
    )
  }

  // plan
  return (
    <span className={`${base} bg-[#1b3c5a]/10 text-[#1b3c5a] border border-[#1b3c5a]/20 ${props.className ?? ''}`}>
      {props.label}
    </span>
  )
}
