'use client'

import { FOG_BADGE, FOG_TITLE, memberPlanBadges } from '@/lib/admin/fog'

const TIER_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  pro: { bg: 'rgba(201,48,42,0.1)', color: '#C9302A', border: 'rgba(201,48,42,0.3)' },
  vip: { bg: 'rgba(201,168,76,0.1)', color: '#a07c1e', border: 'rgba(201,168,76,0.3)' },
}

const GUEST_BADGE = { bg: 'rgba(27,60,90,0.12)', color: '#1b3c5a', border: 'rgba(27,60,90,0.35)' }

const pillClass = 'font-condensed font-bold uppercase text-[12px] px-2 py-0.5 rounded'

export function MemberPlanBadges({
  role,
  tier,
  isComped,
}: {
  role?: string | null
  tier?: string | null
  isComped?: boolean
}) {
  const badges = memberPlanBadges({ role, tier, isComped })
  const tierStyle = TIER_COLORS[tier ?? ''] ?? TIER_COLORS.vip

  if (badges.length === 0) {
    return <span className="font-condensed text-[12px] text-[color:var(--admin-text-2)]">—</span>
  }

  return (
    <>
      {badges.map(badge => {
        if (badge.kind === 'guest') {
          return (
            <span
              key="guest"
              className={pillClass}
              style={{ backgroundColor: GUEST_BADGE.bg, color: GUEST_BADGE.color, border: `1px solid ${GUEST_BADGE.border}` }}
              title="Podcast/keynote guest — comped Professional access, excluded from MRR"
            >
              {badge.label}
            </span>
          )
        }
        if (badge.kind === 'fog') {
          return (
            <span
              key="fog"
              data-testid="fog-badge"
              className={pillClass}
              style={{ backgroundColor: FOG_BADGE.bg, color: FOG_BADGE.color, border: `1px solid ${FOG_BADGE.border}` }}
              title={FOG_TITLE}
            >
              {badge.label}
            </span>
          )
        }
        return (
          <span
            key={`tier-${badge.label}`}
            data-testid={`tier-badge-${badge.label.toLowerCase()}`}
            className={pillClass}
            style={{ backgroundColor: tierStyle.bg, color: tierStyle.color, border: `1px solid ${tierStyle.border}` }}
          >
            {badge.label}
          </span>
        )
      })}
    </>
  )
}
