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

export const CRM_SELECT_COLS =
  'id, full_name, email, phone, company, notes, stage, status, source, last_contacted_at, next_follow_up_at, value_monthly, user_id, created_by, created_at, updated_at'

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
}

export function isCrmStage(v: unknown): v is CrmStage {
  return typeof v === 'string' && (CRM_STAGES as readonly string[]).includes(v)
}

export function isCrmStatus(v: unknown): v is CrmStatus {
  return typeof v === 'string' && (CRM_STATUSES as readonly string[]).includes(v)
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

// ── CSV import / export ─────────────────────────────────────────────────────
// Export columns for the pipeline download; import only requires full_name +
// email (imported rows are always loaded into the Lead stage).
export const PROSPECT_CSV_HEADERS = [
  'full_name', 'email', 'phone', 'company', 'stage', 'status',
  'value_monthly', 'last_contacted_at', 'next_follow_up_at', 'source', 'notes',
] as const

export interface CrmImportRow {
  full_name: string
  email: string
  phone?: string | null
  company?: string | null
  notes?: string | null
  source?: string | null
}

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  // Quote when the value contains a delimiter, quote, or newline (RFC 4180).
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Serialize prospects to a CSV string (header + one row each). */
export function prospectsToCsv(list: CrmProspect[]): string {
  const header = PROSPECT_CSV_HEADERS.join(',')
  const lines = list.map(p =>
    [
      p.full_name, p.email, p.phone, p.company, p.stage, p.status,
      prospectValue(p), p.last_contacted_at, p.next_follow_up_at, p.source, p.notes,
    ].map(csvCell).join(','),
  )
  return [header, ...lines].join('\n')
}

/** Minimal RFC-4180 CSV parser (handles quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = ''
    } else if (c !== '\r') {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  // Drop fully-empty rows (trailing newline, blank lines).
  return rows.filter(r => r.some(cell => cell.trim() !== ''))
}

/**
 * Parse an uploaded CSV into importable Lead rows. Requires a header row with
 * at least name + email columns (accepts common aliases). Rows missing a name
 * or a valid email are skipped and counted.
 */
export function parseProspectsCsv(text: string): { rows: CrmImportRow[]; skipped: number; error?: string } {
  const table = parseCsv(text)
  if (table.length < 2) return { rows: [], skipped: 0, error: 'CSV needs a header row and at least one data row.' }

  const header = table[0].map(h => h.trim().toLowerCase())
  const idx = (aliases: string[]) => header.findIndex(h => aliases.includes(h))
  const nameCol = idx(['full_name', 'name', 'full name', 'contact', 'contact name'])
  const emailCol = idx(['email', 'email address', 'e-mail'])
  const phoneCol = idx(['phone', 'phone number', 'mobile'])
  const companyCol = idx(['company', 'organization', 'organisation', 'account'])
  const notesCol = idx(['notes', 'note', 'comments'])
  const sourceCol = idx(['source', 'lead source', 'channel'])

  if (nameCol === -1 || emailCol === -1) {
    return { rows: [], skipped: 0, error: 'CSV must include "name" and "email" columns.' }
  }

  const rows: CrmImportRow[] = []
  let skipped = 0
  const at = (r: string[], i: number) => (i >= 0 && i < r.length ? r[i].trim() : '')
  for (let i = 1; i < table.length; i++) {
    const r = table[i]
    const full_name = at(r, nameCol)
    const email = at(r, emailCol).toLowerCase()
    if (!full_name || !email.includes('@')) { skipped++; continue }
    rows.push({
      full_name,
      email,
      phone: at(r, phoneCol) || null,
      company: at(r, companyCol) || null,
      notes: at(r, notesCol) || null,
      source: at(r, sourceCol) || 'csv-import',
    })
  }
  return { rows, skipped }
}

export function parseCrmProspect(r: Record<string, unknown>): CrmProspect | null {
  if (typeof r.id !== 'string' || typeof r.email !== 'string') return null
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
  }
}
