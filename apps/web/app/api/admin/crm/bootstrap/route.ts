export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { Client } from 'pg'
import { requireAdminApi } from '@/lib/admin/helpers'
import { adminClient } from '@/lib/supabase/admin'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * POST /api/admin/crm/bootstrap
 *
 * Ensures crm_prospects (+ value/follow-up columns) exist.
 * Prefer DATABASE_URL / SUPABASE_DB_URL when set (runs SQL via `pg`).
 * Without a direct DB URL, reports status so admins can paste migrations.
 */
export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('crm_prospects')
    .select('id, value_monthly, next_follow_up_at')
    .limit(1)

  if (!error) {
    return NextResponse.json({
      status: 'ready',
      table: 'crm_prospects',
      columns061: true,
      rowSample: data?.length ?? 0,
    })
  }

  const msg = String(error.message ?? '')
  if (msg.includes('value_monthly') || msg.includes('next_follow_up')) {
    return NextResponse.json({
      status: 'partial',
      table: 'crm_prospects',
      columns061: false,
      error: msg,
      hint: 'Run supabase/migrations/061_crm_prospects_value_followup.sql',
    })
  }

  return NextResponse.json({
    status: 'missing',
    table: 'crm_prospects',
    columns061: false,
    error: msg,
    hint: 'Run supabase/migrations/060_crm_prospects.sql then 061_…',
  })
}

export async function POST() {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL

  if (!dbUrl) {
    // Attempt soft probe then return instructions
    const statusRes = await GET()
    const statusJson = await statusRes.json()
    return NextResponse.json(
      {
        applied: false,
        reason: 'No DATABASE_URL / SUPABASE_DB_URL in environment',
        status: statusJson,
        migrations: [
          'supabase/migrations/060_crm_prospects.sql',
          'supabase/migrations/061_crm_prospects_value_followup.sql',
        ],
        instructions:
          'Paste both SQL files into the Supabase SQL Editor (Dashboard → SQL), run them, then reopen /admin/crm.',
      },
      { status: 422 },
    )
  }

  try {
    const client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    })
    await client.connect()

    const root = process.cwd()
    // cwd may be monorepo root or apps/web depending on start command
    const candidates = [
      join(root, 'supabase/migrations/060_crm_prospects.sql'),
      join(root, '../../supabase/migrations/060_crm_prospects.sql'),
      join(root, 'apps/web/../../supabase/migrations/060_crm_prospects.sql'),
    ]
    const candidates061 = [
      join(root, 'supabase/migrations/061_crm_prospects_value_followup.sql'),
      join(root, '../../supabase/migrations/061_crm_prospects_value_followup.sql'),
      join(root, 'apps/web/../../supabase/migrations/061_crm_prospects_value_followup.sql'),
    ]

    function readFirst(paths: string[]): string {
      for (const p of paths) {
        try {
          return readFileSync(p, 'utf8')
        } catch {
          /* try next */
        }
      }
      throw new Error(`Migration file not found (cwd=${root})`)
    }

    const sql060 = readFirst(candidates)
    const sql061 = readFirst(candidates061)
    await client.query(sql060)
    await client.query(sql061)
    await client.end()

    return NextResponse.json({ applied: true, migrations: ['060', '061'] })
  } catch (err) {
    console.error('[POST /api/admin/crm/bootstrap]', err)
    return NextResponse.json(
      {
        applied: false,
        error: err instanceof Error ? err.message : String(err),
        instructions:
          'Apply supabase/migrations/060_crm_prospects.sql and 061_crm_prospects_value_followup.sql in the Supabase SQL Editor.',
      },
      { status: 500 },
    )
  }
}
