export const dynamic = 'force-dynamic'

import { requireAdminApi } from '@/lib/admin/helpers'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  const { data, error } = await adminClient
    .from('job_listings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  return NextResponse.json({ jobs: data })
}

export async function POST(request: Request) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const row = {
    title: String(body.title ?? ''),
    company: String(body.company ?? ''),
    location: String(body.location ?? ''),
    job_type: String(body.job_type ?? 'Full-time'),
    salary_range: String(body.salary_range ?? ''),
    description: String(body.description ?? ''),
    apply_url: String(body.apply_url ?? ''),
    category: String(body.category ?? 'Other'),
    is_featured: Boolean(body.is_featured),
    status: String(body.status ?? 'draft'),
  }

  if (!row.title || !row.company || !row.apply_url) {
    return NextResponse.json({ error: 'title, company, and apply_url are required' }, { status: 422 })
  }

  const { data, error } = await adminClient
    .from('job_listings')
    .insert(row)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
