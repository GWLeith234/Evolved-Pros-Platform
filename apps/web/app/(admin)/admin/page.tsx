import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import AdminDashboard from './AdminDashboard'
export const dynamic = 'force-dynamic'
export default async function AdminPage() {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) redirect('/login')
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/home')
  const { data: members, error } = await supabase
    .from('users')
    .select('id, email, full_name, display_name, tier, tier_status, role, created_at, avatar_url, points')
    .order('created_at', { ascending: false })
  if (error) console.error('[admin/page] members fetch error:', error)
  const allMembers = members ?? []
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const stats = {
    total: allMembers.length,
    community: allMembers.filter(m => (m.tier ?? '').toLowerCase() === 'community').length,
    pro: allMembers.filter(m => (m.tier ?? '').toLowerCase() === 'pro').length,
    newThisMonth: allMembers.filter(m => new Date(m.created_at) >= monthStart).length,
  }
  return <AdminDashboard initialMembers={allMembers} stats={stats} />
}
