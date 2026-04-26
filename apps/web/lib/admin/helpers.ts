import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

// Re-export utils so existing server-side imports don't break.
export type { EngagementLevel } from './utils'
export {
  getEngagementLevel,
  getEngagementScore,
  getTierMrr,
  getVendastaCrmUrl,
} from './utils'

// Server-side admin check — call at the top of API routes.
// RLS-FIX: resolve role + id via email through adminClient. The previous
// .eq('id', user.id) lookup silently returned null for users where
// auth.uid() ≠ public.users.id, treating them as non-admins. The returned
// userId is the resolved public.users.id (used by admin_audit_log.admin_id
// FK), not auth.uid().
export async function requireAdminApi(): Promise<{ userId: string } | Response> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const { data: profile } = await adminClient
    .from('users')
    .select('id, role')
    .eq('email', user.email)
    .single()
  if (!profile || profile.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return { userId: profile.id }
}

// Server-side admin check for page routes — redirects.
// Same RLS-FIX as requireAdminApi.
export async function requireAdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')
  const { data: profile } = await adminClient
    .from('users')
    .select('role, display_name, full_name')
    .eq('email', user.email)
    .single()
  if (!profile || profile.role !== 'admin') redirect('/home')
  return profile
}
