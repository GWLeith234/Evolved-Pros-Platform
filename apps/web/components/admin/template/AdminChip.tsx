import type { ReactNode } from 'react'

export type AdminChipTone =
  | 'community'
  | 'vip'
  | 'pro'
  | 'gold'
  | 'teal'
  | 'pink'
  | 'data'
  | 'published'
  | 'pilot'
  | 'draft'

const CHIP: Record<Exclude<AdminChipTone, 'published' | 'pilot' | 'draft'>, string> = {
  community: 'ep-admin-el-chip ep-admin-el-chip--community',
  vip: 'ep-admin-el-chip ep-admin-el-chip--vip',
  pro: 'ep-admin-el-chip ep-admin-el-chip--pro',
  gold: 'ep-admin-el-chip ep-admin-el-chip--gold',
  teal: 'ep-admin-el-chip ep-admin-el-chip--teal',
  pink: 'ep-admin-el-chip ep-admin-el-chip--pink',
  data: 'ep-admin-el-chip ep-admin-el-chip--data',
}

/** Gold / teal / pink data badges. Not for chrome or primary actions. */
export function AdminChip({
  tone = 'data',
  children,
}: {
  tone?: Exclude<AdminChipTone, 'published' | 'pilot' | 'draft'>
  children: ReactNode
}) {
  return <span className={CHIP[tone]}>{children}</span>
}

/** Status is a chip only. Never a publish control. */
export function AdminStatusChip({
  status,
  children,
}: {
  status: 'published' | 'pilot' | 'draft'
  children?: ReactNode
}) {
  return (
    <span className={`ep-admin-el-status ep-admin-el-status--${status}`}>
      {children ?? status}
    </span>
  )
}

export function AdminToggle({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`ep-admin-el-toggle${on ? ' is-on' : ''}`}
      aria-label={label}
    />
  )
}
