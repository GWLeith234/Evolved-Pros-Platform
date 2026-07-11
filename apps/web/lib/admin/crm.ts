/** Shared CRM stage definitions for Prospects lifecycle board. */

export const CRM_STAGES = [
  'lead',
  'prospect',
  'community',
  'vip',
  'professional',
] as const

export type CrmStage = (typeof CRM_STAGES)[number]

export const CRM_STATUSES = [
  'active',
  'contacted',
  'nurture',
  'won',
  'lost',
] as const

export type CrmStatus = (typeof CRM_STATUSES)[number]

export interface CrmStageMeta {
  stage: CrmStage
  label: string
  desc: string
  /** Monthly value estimate for pipeline MRR display */
  mrr: number
  accent: string
  accentSoft: string
}

export const CRM_STAGE_META: Record<CrmStage, CrmStageMeta> = {
  lead: {
    stage: 'lead',
    label: 'Lead',
    desc: 'New inbound / cold',
    mrr: 0,
    accent: '#7a8a96',
    accentSoft: 'rgba(122,138,150,0.12)',
  },
  prospect: {
    stage: 'prospect',
    label: 'Prospect',
    desc: 'On email campaign',
    mrr: 0,
    accent: '#60A5FA',
    accentSoft: 'rgba(96,165,250,0.12)',
  },
  community: {
    stage: 'community',
    label: 'Community',
    desc: 'FREE membership',
    mrr: 0,
    accent: '#0ABFA3',
    accentSoft: 'rgba(10,191,163,0.12)',
  },
  vip: {
    stage: 'vip',
    label: 'VIP',
    desc: '$9/mo',
    mrr: 9,
    accent: '#C9A84C',
    accentSoft: 'rgba(201,168,76,0.14)',
  },
  professional: {
    stage: 'professional',
    label: 'Professional',
    desc: '$49/mo',
    mrr: 49,
    accent: '#C9302A',
    accentSoft: 'rgba(201,48,42,0.12)',
  },
}

export const CRM_COLUMNS: CrmStageMeta[] = CRM_STAGES.map(s => CRM_STAGE_META[s])

export interface CrmProspect {
  id: string
  full_name: string
  email: string
  phone: string | null
  company: string | null
  notes: string | null
  stage: CrmStage
  status: CrmStatus
  source: string | null
  last_contacted_at: string | null
  user_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export function isCrmStage(v: unknown): v is CrmStage {
  return typeof v === 'string' && (CRM_STAGES as readonly string[]).includes(v)
}

export function isCrmStatus(v: unknown): v is CrmStatus {
  return typeof v === 'string' && (CRM_STATUSES as readonly string[]).includes(v)
}

/** Next paid stage for the "Upgrade" quick action. */
export function nextUpgradeStage(stage: CrmStage): CrmStage | null {
  if (stage === 'lead' || stage === 'prospect') return 'community'
  if (stage === 'community') return 'vip'
  if (stage === 'vip') return 'professional'
  return null
}
