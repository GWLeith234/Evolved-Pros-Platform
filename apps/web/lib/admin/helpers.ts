import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type EngagementLevel = 'High' | 'Med' | 'Low'

export function getEngagementLevel(postsLast30: number, lessonsLast30: number): EngagementLevel {
  const score = postsLast30 * 2 + lessonsLast30
  if (score >= 10) return 'High'
  if (score >= 3)  return 'Med'
  return 'Low'
}

export function getEngagementScore(postsLast30: number, lessonsLast30: number): number {
  return postsLast30 * 2 + lessonsLast30
}

export function getTierMrr(tier: string | null, tierStatus: string | null): number {
  if (!tierStatus || tierStatus === 'cancelled' || tierStatus === 'expired') return 0
  if (tier === 'pro') return 79
  if (tier === 'community') return 39
  return 0
}

export function getVendastaCrmUrl(contactId: string): string {
  return `https://business.vendasta.com/crm/contacts/${contactId}`
}

// Server-side admin check — call at the top of API routes
export async function requireAdminApi(): Promise<{ userId: string } | Response> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
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
