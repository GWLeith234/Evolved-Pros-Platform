/** Shared CRM stage definitions for Prospects lifecycle board. */

import { TIERS } from '@/lib/pricing'

/** Exact product tag for Conversations AI leads. Must survive lowercase normalize. */
export const AI_GEORGE_TAG = 'AI George'

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

/** CASL consent basis (migration 076). */
export const CRM_CONSENT_BASES = ['express', 'implied', 'unknown'] as const

export type CrmConsentBasis = (typeof CRM_CONSENT_BASES)[number]

/** Automated enrichment job lifecycle (migration 076). */
export const CRM_ENRICHMENT_STATUSES = ['none', 'pending', 'enriched', 'failed'] as const

export type CrmEnrichmentStatus = (typeof CRM_ENRICHMENT_STATUSES)[number]

/** Max tag chips rendered on a card before collapsing into a +N counter. */
export const CRM_TAG_DISPLAY_LIMIT = 3

export interface CrmStageMeta {
  stage: CrmStage
  label: string
  desc: string
  /** Default monthly value ($) for pipeline estimates */
  mrr: number
  accent: string
  accentSoft: string
}

/** Catalog prices used by CRM + Products admin (user-facing membership ladder). */
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
    desc: `$${TIERS.vip.monthly}/mo`,
    mrr: TIERS.vip.monthly,
    accent: '#C9A84C',
    accentSoft: 'rgba(201,168,76,0.14)',
  },
  professional: {
    stage: 'professional',
    label: 'Professional',
    desc: `$${TIERS.professional.monthly}/mo`,
    mrr: TIERS.professional.monthly,
    accent: '#C9302A',
    accentSoft: 'rgba(201,48,42,0.12)',
  },
}

export const CRM_COLUMNS: CrmStageMeta[] = CRM_STAGES.map(s => CRM_STAGE_META[s])

export const CRM_SELECT_COLS =
  'id, full_name, email, phone, company, notes, stage, status, source, last_contacted_at, next_follow_up_at, value_monthly, user_id, created_by, created_at, updated_at, ' +
  'title, linkedin_url, avatar_url, location, tags, consent_basis, keynote_interest, enrichment_status, enriched_at, unsubscribed_at'

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
  next_follow_up_at: string | null
  /** Explicit deal value; falls back to stage default when null */
  value_monthly: number | null
  user_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // ── Enrichment fields (migration 076) ──────────────────────────────────
  title: string | null
  linkedin_url: string | null
  avatar_url: string | null
  location: string | null
  /** Never null — the column is NOT NULL DEFAULT '{}'. */
  tags: string[]
  consent_basis: CrmConsentBasis
  keynote_interest: boolean
  enrichment_status: CrmEnrichmentStatus
  enriched_at: string | null
  /** When set, this prospect is suppressed — never email them. */
  unsubscribed_at: string | null
}

export function isCrmStage(v: unknown): v is CrmStage {
  return typeof v === 'string' && (CRM_STAGES as readonly string[]).includes(v)
}

export function isCrmStatus(v: unknown): v is CrmStatus {
  return typeof v === 'string' && (CRM_STATUSES as readonly string[]).includes(v)
}

export function isConsentBasis(v: unknown): v is CrmConsentBasis {
  return typeof v === 'string' && (CRM_CONSENT_BASES as readonly string[]).includes(v)
}

export function isEnrichmentStatus(v: unknown): v is CrmEnrichmentStatus {
  return typeof v === 'string' && (CRM_ENRICHMENT_STATUSES as readonly string[]).includes(v)
}

/**
 * Normalize a free-form tag list: trim, drop blanks, lowercase, dedupe, and
 * preserve first-seen order. Shared by the API layer and the edit form so a
 * round-trip through the modal can't silently reorder or duplicate tags.
 *
 * Exception: `AI George` keeps that exact casing (sprint S3 lock).
 */
export function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of input) {
    if (typeof raw !== 'string') continue
    const trimmed = raw.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(key === AI_GEORGE_TAG.toLowerCase() ? AI_GEORGE_TAG : key)
  }
  return out
}

/** Split the comma-separated tag input used by the prospect form. */
export function parseTagInput(value: string): string[] {
  return normalizeTags(value.split(','))
}

/** Initials fallback for a prospect with no avatar_url. */
export function prospectInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Only http(s) URLs are usable as an <img src> or an outbound link. Rejecting
 * everything else here keeps 'javascript:' / 'data:' payloads out of the DOM
 * as well as out of the database.
 */
export function isHttpUrl(v: unknown): v is string {
  if (typeof v !== 'string' || !v.trim()) return false
  let u: URL
  try {
    u = new URL(v.trim())
  } catch {
    return false
  }
  return u.protocol === 'http:' || u.protocol === 'https:'
}

/** Effective monthly value for a prospect. */
export function prospectValue(p: Pick<CrmProspect, 'value_monthly' | 'stage'>): number {
  if (typeof p.value_monthly === 'number' && Number.isFinite(p.value_monthly)) {
    return p.value_monthly
  }
  return CRM_STAGE_META[p.stage]?.mrr ?? 0
}

export function formatMoney(n: number): string {
  if (n === 0) return 'Free'
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function formatShortDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function relativeContact(iso: string | null): string {
  if (!iso) return 'Never'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 'Never'
  const days = Math.floor((Date.now() - t) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 14) return `${days}d ago`
  return formatShortDate(iso)
}

export function followUpLabel(iso: string | null): { text: string; overdue: boolean } {
  if (!iso) return { text: 'Not set', overdue: false }
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return { text: 'Not set', overdue: false }
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const days = Math.ceil((t - startOfToday.getTime()) / 86_400_000)
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, overdue: true }
  if (days === 0) return { text: 'Due today', overdue: true }
  if (days === 1) return { text: 'Tomorrow', overdue: false }
  if (days < 14) return { text: `In ${days}d`, overdue: false }
  return { text: formatShortDate(iso), overdue: false }
}

/** Next paid stage for generic Upgrade. */
export function nextUpgradeStage(stage: CrmStage): CrmStage | null {
  if (stage === 'lead' || stage === 'prospect') return 'community'
  if (stage === 'community') return 'vip'
  if (stage === 'vip') return 'professional'
  return null
}

/** Paid upgrade targets from Community (VIP + Professional). */
export function communityUpgradeTargets(): CrmStage[] {
  return ['vip', 'professional']
}

export function parseCrmProspect(r: Record<string, unknown>): CrmProspect | null {
  // Email is optional after 087 (SMS-only AI George rows). A null email must
  // still parse so the board does not drop the prospect.
  if (typeof r.id !== 'string') return null
  if (r.email != null && typeof r.email !== 'string') return null
  const valueRaw = r.value_monthly
  const value =
    typeof valueRaw === 'number'
      ? valueRaw
      : typeof valueRaw === 'string' && valueRaw !== ''
        ? Number(valueRaw)
        : null
  return {
    id: r.id,
    full_name: String(r.full_name ?? ''),
    email: String(r.email ?? ''),
    phone: (r.phone as string | null) ?? null,
    company: (r.company as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    stage: isCrmStage(r.stage) ? r.stage : 'lead',
    status: isCrmStatus(r.status) ? r.status : 'active',
    source: (r.source as string | null) ?? null,
    last_contacted_at: (r.last_contacted_at as string | null) ?? null,
    next_follow_up_at: (r.next_follow_up_at as string | null) ?? null,
    value_monthly: value != null && Number.isFinite(value) ? value : null,
    user_id: (r.user_id as string | null) ?? null,
    created_by: (r.created_by as string | null) ?? null,
    created_at: String(r.created_at ?? new Date().toISOString()),
    updated_at: String(r.updated_at ?? new Date().toISOString()),
    // Enrichment fields default to the pre-076 shape so a row read back before
    // the migration lands still parses instead of dropping the whole prospect.
    title: (r.title as string | null) ?? null,
    linkedin_url: (r.linkedin_url as string | null) ?? null,
    avatar_url: (r.avatar_url as string | null) ?? null,
    location: (r.location as string | null) ?? null,
    tags: normalizeTags(r.tags),
    consent_basis: isConsentBasis(r.consent_basis) ? r.consent_basis : 'unknown',
    keynote_interest: r.keynote_interest === true,
    enrichment_status: isEnrichmentStatus(r.enrichment_status) ? r.enrichment_status : 'none',
    enriched_at: (r.enriched_at as string | null) ?? null,
    unsubscribed_at: (r.unsubscribed_at as string | null) ?? null,
  }
}
