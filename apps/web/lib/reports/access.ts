import 'server-only'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isReportSlug, seededViewer, shapeFixtureEnabled, type ReportSlug } from './paths'
import { readShapeFixture } from './shell'

export type ReportCaller = {
  ids: string[]
  /** Carried so tests can pass an admin role. The gate does not read it. */
  role?: string | null
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: { id?: string } | null }>
      }
    }
  }
}

function rpcClient(): RpcClient {
  return adminClient as unknown as RpcClient
}

function cleanIds(ids: string[]): string[] {
  return [...new Set(ids.filter(id => UUID.test(id)))]
}

/**
 * Session to platform user ids. Checks auth.uid() and public.users.id,
 * because those drift on older accounts. Development honors dev_session.
 * Production ignores that cookie.
 */
export async function loadReportCaller(): Promise<ReportCaller | null> {
  if (process.env.NODE_ENV === 'development') {
    const raw = cookies().get('dev_session')?.value
    if (raw) {
      try {
        const profile = JSON.parse(raw) as { id?: string; role?: string | null }
        const ids = cleanIds(profile.id ? [profile.id] : [])
        if (ids.length === 0) return null
        return { ids, role: profile.role ?? null }
      } catch {
        return null
      }
    }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const ids = [user.id]
  const client = rpcClient()
  const { data: byId } = await client.from('users').select('id').eq('id', user.id).maybeSingle()
  if (!byId && user.email) {
    const { data: byEmail } = await client
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()
    if (byEmail?.id) ids.push(byEmail.id)
  }
  const cleaned = cleanIds(ids)
  if (cleaned.length === 0) return null
  return { ids: cleaned }
}

export async function callerIsAllowlisted(ids: string[]): Promise<boolean> {
  const cleaned = cleanIds(ids)
  if (cleaned.length === 0) return false
  if (shapeFixtureEnabled()) return cleaned.some(seededViewer)
  const client = rpcClient()
  for (const id of cleaned) {
    const { data, error } = await client.rpc('report_viewer_allows', { p_user_id: id })
    if (error) return false
    if (data === true) return true
  }
  return false
}

export async function weeklyReportsNavHref(ids: Array<string | null | undefined>): Promise<string | null> {
  try {
    const cleaned = cleanIds(ids.filter((id): id is string => Boolean(id)))
    if (cleaned.length === 0) return null
    if (await callerIsAllowlisted(cleaned)) return '/admin/reports'
    return null
  } catch {
    return null
  }
}

/**
 * Payload for report.json. Fixture mode returns the committed shape file
 * with an EXAMPLE label. Production reads the service-role RPC and does
 * not log the body.
 */
export async function readWeeklyPayload(slug: string): Promise<unknown | null> {
  if (!isReportSlug(slug)) return null
  if (shapeFixtureEnabled()) return labelledShape(slug)
  const client = rpcClient()
  const { data, error } = await client.rpc('weekly_report_read', { p_slug: slug })
  if (error || data == null) return null
  return data
}

function labelledShape(slug: ReportSlug): unknown | null {
  const raw = readShapeFixture(slug)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const data = raw as Record<string, unknown>
  data.week = 'EXAMPLE DATA'
  data.footer = 'EXAMPLE DATA. Not a real report.'
  return data
}
