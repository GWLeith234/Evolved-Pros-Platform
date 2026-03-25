import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Re-export utils so existing server-side imports don't break.
export type { EngagementLevel } from './utils'
export {
  getEngagementLevel,
  getEngagementScore,
  getTierMrr,
  getVendastaCrmUrl,
} from './utils'

// Server-side admin check — call at the top of API routes
export async function requireAdminApi(): Promise<{ userId: string } | Response> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return { userId: user.id }
}

// Server-side admin check for page routes — redirects
export async function requireAdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('users')
    .select('role, display_name, full_name')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/home')
  return profile
}
