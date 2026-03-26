'use client'
import { useState, useMemo } from 'react'
type Member = {
  id: string
  email: string
  full_name: string | null
  display_name: string | null
  tier: string | null
  tier_status: string | null
  role: string | null
  created_at: string
  avatar_url: string | null
  points: number | null
}
type Stats = {
  total: number
  community: number
  pro: number
  newThisMonth: number
}
type TierFilter = 'all' | 'community' | 'pro'
export default function AdminDashboard({
  initialMembers,
  stats,
}: {
  initialMembers: Member[]
  stats: Stats
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteFullName, setInviteFullName] = useState('')
  const [inviteTier, setInviteTier] = useState<'community' | 'pro'>('community')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return members.filter(m => {
      const matchSearch =
        !q ||
        (m.full_name ?? '').toLowerCase().includes(q) ||
        (m.display_name ?? '').toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      const matchTier =
        tierFilter === 'all' || (m.tier ?? '').toLowerCase() === tierFilter
      return matchSearch && matchTier
    })
  }, [members, search, tierFilter])
  async function updateMember(id: string, updates: { tier?: string; tier_status?: string }) {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Update failed')
      }
      setMembers(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)))
    } catch (e) {
      console.error('[AdminDashboard] updateMember:', e)
    } finally {
      setLoadingId(null)
    }
  }
  async function handleInvite() {
    if (!inviteEmail) return
    setInviteLoading(true)
    setInviteError('')
    setInviteSuccess('')
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, fullName: inviteFullName, tier: inviteTier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Invite failed')
      setInviteSuccess(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
      setInviteFullName('')
      const r2 = await fetch('/api/admin/members')
      const d2 = await r2.json()
      if (d2.members) setMembers(d2.members)
    } catch (e: unknown) {
      setInviteError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setInviteLoading(false)
    }
  }
  function closeInvite() {
    setShowInvite(false)
    setInviteError('')
    setInviteSuccess('')
  }
  function getInitials(m: Member) {
    const name = m.full_name ?? m.display_name ?? m.email
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  function formatDate(str: string) {
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  const isSuspended = (m: Member) => (m.tier_status ?? '').toLowerCase() === 'suspended'
  return (
    <div style={{ background: '#faf9f7', minHeight: '100%' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(27,60,90,0.12)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#112535' }}>Admin Dashboard</div>
          <div style={labelStyle}>Member Management</div>
        </div>
        <button onClick={() => setShowInvite(true)} style={btnPrimary}>+ Invite Member</button>
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label="Total Members"  value={stats.total}        accent="#112535" />
          <StatCard label="Community"      value={stats.community}    accent="#68a2b9" />
          <StatCard label="Pro"            value={stats.pro}          accent="#ef0e30" />
          <StatCard label="New This Month" value={stats.newThisMonth} accent="#c9a84c" />
        </div>
        <div style={{ background: '#fff', border: '1px solid rgba(27,60,90,0.12)', padding: '14px 20px', marginBottom: 2, display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="text" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputBase, flex: 1 }} />
          {(['all', 'community', 'pro'] as TierFilter[]).map(t => (
            <button key={t} onClick={() => setTierFilter(t)} style={{ ...filterBtn, background: tierFilter === t ? '#112535' : 'transparent', color: tierFilter === t ? '#fff' : '#7a8a96', borderColor: tierFilter === t ? '#112535' : 'rgba(27,60,90,0.15)' }}>
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <span style={{ ...labelStyle, whiteSpace: 'nowrap' }}>{filtered.length} member{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ background: '#fff', border: '1px solid rgba(27,60,90,0.12)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(27,60,90,0.08)' }}>
                {['Member', 'Tier', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7a8a96' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(27,60,90,0.06)' : 'none', opacity: loadingId === m.id ? 0.45 : 1, transition: 'opacity 0.2s', background: isSuspended(m) ? 'rgba(239,14,48,0.015)' : 'transparent' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: '#112535', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, color: '#fff', flexShrink: 0 }}>{getInitials(m)}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#112535', lineHeight: 1.3 }}>{m.full_name ?? m.display_name ?? '—'}</div>
                        <div style={{ fontSize: 11, color: '#7a8a96' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <select value={(m.tier ?? 'community').toLowerCase()} onChange={e => updateMember(m.id, { tier: e.target.value })} disabled={loadingId === m.id} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 8px', border: '1px solid', borderColor: (m.tier ?? '').toLowerCase() === 'pro' ? 'rgba(239,14,48,0.35)' : 'rgba(104,162,185,0.45)', color: (m.tier ?? '').toLowerCase() === 'pro' ? '#ef0e30' : '#3a7a90', background: (m.tier ?? '').toLowerCase() === 'pro' ? 'rgba(239,14,48,0.05)' : 'rgba(104,162,185,0.08)', cursor: 'pointer', outline: 'none' }}>
                      <option value="community">Community</option>
                      <option value="pro">Pro</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', background: isSuspended(m) ? 'rgba(239,14,48,0.08)' : 'rgba(104,162,185,0.12)', color: isSuspended(m) ? '#c50a26' : '#3a7a90' }}>
                      {isSuspended(m) ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#7a8a96' }}>{formatDate(m.created_at)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => updateMember(m.id, { tier_status: isSuspended(m) ? 'active' : 'suspended' })} disabled={loadingId === m.id} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 12px', border: '1px solid', borderColor: isSuspended(m) ? 'rgba(104,162,185,0.45)' : 'rgba(239,14,48,0.35)', color: isSuspended(m) ? '#3a7a90' : '#c50a26', background: 'transparent', cursor: loadingId === m.id ? 'not-allowed' : 'pointer' }}>
                      {isSuspended(m) ? 'Activate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#7a8a96', fontSize: 13 }}>No members found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,24,33,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 460, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#112535' }}>Invite Member</div>
              <button onClick={closeInvite} style={{ background: 'none', border: 'none', fontSize: 20, color: '#7a8a96', cursor: 'pointer' }}>×</button>
            </div>
            {inviteSuccess && <div style={{ padding: '12px 16px', background: 'rgba(104,162,185,0.1)', border: '1px solid rgba(104,162,185,0.3)', color: '#3a7a90', fontSize: 13, marginBottom: 16 }}>{inviteSuccess}</div>}
            {inviteError && <div style={{ padding: '12px 16px', background: 'rgba(239,14,48,0.06)', border: '1px solid rgba(239,14,48,0.2)', color: '#c50a26', fontSize: 13, marginBottom: 16 }}>{inviteError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={{ display: 'block', ...labelStyle, marginBottom: 6 }}>Email Address</label><input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="member@example.com" style={inputBase} /></div>
              <div><label style={{ display: 'block', ...labelStyle, marginBottom: 6 }}>Full Name</label><input type="text" value={inviteFullName} onChange={e => setInviteFullName(e.target.value)} placeholder="Jane Smith" style={inputBase} /></div>
              <div><label style={{ display: 'block', ...labelStyle, marginBottom: 6 }}>Membership Tier</label><select value={inviteTier} onChange={e => setInviteTier(e.target.value as 'community' | 'pro')} style={inputBase}><option value="community">Community — $39/mo</option><option value="pro">Pro — $79/mo</option></select></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={closeInvite} style={btnOutline}>Cancel</button>
              <button onClick={handleInvite} disabled={inviteLoading || !inviteEmail} style={{ ...btnPrimary, flex: 2, opacity: inviteLoading || !inviteEmail ? 0.55 : 1, cursor: inviteLoading || !inviteEmail ? 'not-allowed' : 'pointer' }}>{inviteLoading ? 'Sending…' : 'Send Invite'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(27,60,90,0.12)', padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent }} />
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 900, color: '#112535', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={labelStyle}>{label}</div>
    </div>
  )
}
const labelStyle: React.CSSProperties = { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7a8a96' }
const inputBase: React.CSSProperties = { width: '100%', border: '1px solid rgba(27,60,90,0.2)', padding: '9px 12px', fontFamily: "'Barlow', sans-serif", fontSize: 13, color: '#112535', background: '#faf9f7', outline: 'none', boxSizing: 'border-box' }
const btnPrimary: React.CSSProperties = { background: '#ef0e30', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '11px 20px', border: 'none', cursor: 'pointer', flex: 1 }
const btnOutline: React.CSSProperties = { background: 'transparent', color: '#7a8a96', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '11px 18px', border: '1px solid rgba(27,60,90,0.2)', cursor: 'pointer', flex: 1 }
const filterBtn: React.CSSProperties = { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 14px', border: '1px solid', cursor: 'pointer' }
