/**
 * POST /api/admin/crm/import — batched CSV import for the CRM (SPRINT CRM-2).
 *
 * The wizard chunks a parsed file into <= CRM_IMPORT_BATCH_SIZE row batches and
 * posts them one at a time so it can drive a progress bar. Each batch is
 * independent: it reports its own counts and never fails the whole import.
 *
 * PII: this route handles contact lists. Nothing here logs an email address,
 * a name, or any row content — not even inside error paths, because Postgres
 * puts the conflicting value straight into a unique-violation message
 * ("Key (lower(email))=(someone@example.com) already exists"). Errors are
 * logged by code and route only.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import { isConsentBasis, normalizeTags } from '@/lib/admin/crm'
import {
  CRM_IMPORT_BATCH_SIZE,
  analyzeRows,
  type ImportBatchResult,
  type MappedRow,
} from '@/lib/admin/crmImport'

const PG_UNIQUE_VIOLATION = '23505'

/** Trim a mapped row's optional text field to a sane column width. */
function text(v: unknown, max = 300): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, max)
  return t || null
}

export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.rows)) {
    return NextResponse.json({ error: 'rows must be an array' }, { status: 422 })
  }
  if (body.rows.length > CRM_IMPORT_BATCH_SIZE) {
    return NextResponse.json(
      { error: `Too many rows — send at most ${CRM_IMPORT_BATCH_SIZE} per request.` },
      { status: 422 },
    )
  }
  if (!isConsentBasis(body.consent_basis)) {
    return NextResponse.json(
      { error: 'consent_basis must be one of: express, implied, unknown' },
      { status: 422 },
    )
  }
  const source = text(body.source, 120)
  const tags = normalizeTags(body.tags)

  // Re-run validation and in-file dedupe server-side. The wizard already did
  // this, but the endpoint must not trust the client to have done it.
  const { valid, invalid, duplicatesInFile } = analyzeRows(body.rows as MappedRow[])

  const result: ImportBatchResult = {
    imported: 0,
    dupPros: 0,
    dupMembers: 0,
    // In-file duplicates inside a batch are duplicates of an existing prospect
    // by the time the batch lands, so they are reported the same way.
    invalid,
  }
  result.dupPros += duplicatesInFile

  if (valid.length === 0) {
    return NextResponse.json(result)
  }

  const emails = valid.map(r => r.email)

  /**
   * Collect the emails from `table` that already exist among this batch.
   * Emails are stored lowercase (every write path normalizes) and the 076
   * unique index is on lower(email), so an exact `in` match is equivalent to a
   * case-insensitive one; results are lowercased anyway so a legacy mixed-case
   * row can't slip through.
   */
  async function existingEmails(table: string): Promise<Set<string> | Response> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient as any).from(table).select('email').in('email', emails)
    if (error) {
      console.error('[POST /api/admin/crm/import] lookup failed', table, error.code ?? 'unknown')
      return NextResponse.json({ error: 'Import lookup failed' }, { status: 500 })
    }
    return new Set(
      ((data ?? []) as Array<{ email: string | null }>).map(r => (r.email ?? '').toLowerCase()),
    )
  }

  const prosSet = await existingEmails('crm_prospects')
  if (prosSet instanceof Response) return prosSet

  // Existing platform members are reported separately so George can see how
  // much of a list is already inside the product.
  const memberSet = await existingEmails('users')
  if (memberSet instanceof Response) return memberSet

  const toInsert = valid.filter(r => {
    // Member check first: "already a member" is the more useful label when a
    // contact is both a prospect and a signed-up user.
    if (memberSet.has(r.email)) {
      result.dupMembers++
      return false
    }
    if (prosSet.has(r.email)) {
      result.dupPros++
      return false
    }
    return true
  })

  if (toInsert.length === 0) {
    return NextResponse.json(result)
  }

  const now = new Date().toISOString()
  const buildRow = (r: MappedRow) => ({
    full_name: (r.full_name || r.email).slice(0, 200),
    email: r.email,
    phone: text(r.phone, 60),
    company: text(r.company),
    title: text(r.title),
    location: text(r.location),
    linkedin_url: text(r.linkedin_url, 500),
    notes: text(r.notes, 2000),
    source,
    tags,
    consent_basis: body.consent_basis,
    stage: 'lead',
    status: 'active',
    enrichment_status: 'none',
    created_by: auth.userId,
    updated_at: now,
  })

  const rows = toInsert.map(buildRow)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insert = (payload: unknown) => (adminClient as any).from('crm_prospects').insert(payload).select('id')

  const { data, error } = await insert(rows)

  if (!error) {
    result.imported += Array.isArray(data) ? data.length : rows.length
    return NextResponse.json(result)
  }

  // A unique violation here is a race: someone (or a parallel batch) inserted
  // one of these emails between our lookup and our insert. PostgREST cannot
  // express ON CONFLICT against an expression index like lower(email), so
  // instead of failing the batch we replay it row by row and count the
  // collisions. Rare, and bounded by the batch size.
  if (error.code === PG_UNIQUE_VIOLATION) {
    for (const row of rows) {
      const { error: rowErr } = await insert(row)
      if (!rowErr) {
        result.imported++
      } else if (rowErr.code === PG_UNIQUE_VIOLATION) {
        result.dupPros++
      } else {
        console.error('[POST /api/admin/crm/import] row insert failed', rowErr.code ?? 'unknown')
        return NextResponse.json({ error: 'Import failed partway through this batch', ...result }, { status: 500 })
      }
    }
    return NextResponse.json(result)
  }

  console.error('[POST /api/admin/crm/import] batch insert failed', error.code ?? 'unknown')
  return NextResponse.json({ error: 'Import failed' }, { status: 500 })
}
