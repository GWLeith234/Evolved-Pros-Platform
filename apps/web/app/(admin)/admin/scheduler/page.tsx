'use client'

import { useState, useEffect } from 'react'
import { PostQueue } from '@/components/scheduler/PostQueue'

interface ScheduledPost {
  id: string
  body: string
  status: string
  scheduled_at: string
  ai_generated: boolean
}

export default function SchedulerPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadPosts() }, [])

  async function loadPosts() {
    const res = await fetch('/api/admin/scheduler/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: '__list__', action: 'approve' }),
    }).catch(() => null)

    // Direct Supabase query via a simple GET pattern
    // For now, just fetch scheduled posts through the generate endpoint info
  }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/scheduler/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setPosts(data.posts ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  async function handleAction(postId: string, action: 'approve' | 'reject', body?: string) {
    try {
      const res = await fetch('/api/admin/scheduler/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action, body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Action failed')
      if (action === 'reject') {
        setPosts(prev => prev.filter(p => p.id !== postId))
      } else {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'approved', ...data.post } : p))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  async function handleApproveAll() {
    const pendingIds = posts.filter(p => p.status === 'scheduled').map(p => p.id)
    if (!pendingIds.length) return
    await Promise.all(pendingIds.map(id =>
      fetch('/api/admin/scheduler/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id, action: 'approve' }),
      })
    ))
    setPosts(prev => prev.map(p => p.status === 'scheduled' ? { ...p, status: 'approved' } : p))
  }

  const pending = posts.filter(p => p.status === 'scheduled')
  const approved = posts.filter(p => p.status === 'approved' || p.status === 'published')

  return (
    <div className="px-8 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-1" style={{ color: '#68a2b9' }}>
            Automation
          </p>
          <h1 className="font-display font-black text-[28px]" style={{ color: '#1b3c5a' }}>
            Post Scheduler
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {pending.length > 0 && (
            <>
              <span className="font-condensed font-bold text-[11px] px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                {pending.length} queued
              </span>
              <button
                type="button"
                onClick={handleApproveAll}
                className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] px-4 py-2 rounded transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'rgba(10,191,163,0.12)', color: '#0ABFA3', border: '1px solid rgba(10,191,163,0.2)' }}
              >
                Approve all pending
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="font-condensed font-bold uppercase tracking-[0.1em] text-[12px] px-5 py-2.5 rounded transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C9A84C', color: '#0A0F18', opacity: generating ? 0.5 : 1 }}
          >
            {generating ? 'Generating...' : 'Generate Week \u2192'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded px-4 py-3 mb-6 font-condensed text-[12px]" style={{ backgroundColor: 'rgba(239,14,48,0.08)', color: '#ef0e30', border: '1px solid rgba(239,14,48,0.2)' }}>
          {error}
        </div>
      )}

      {/* Stats */}
      {posts.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Approved', value: approved.length, color: '#0ABFA3' },
            { label: 'Pending', value: pending.length, color: '#C9A84C' },
            { label: 'Total Scheduled', value: posts.length, color: '#60A5FA' },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-4" style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
              <p className="font-display font-black text-[32px] leading-none" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Queue */}
      {posts.length > 0 ? (
        <PostQueue posts={posts} onAction={handleAction} />
      ) : !generating && (
        <div className="rounded-xl px-8 py-16 text-center" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
          <p className="font-condensed font-bold uppercase tracking-widest text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            No posts scheduled
          </p>
          <p className="font-body text-[13px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Click &ldquo;Generate Week&rdquo; to create 7 AI-authored posts with optimised timing.
          </p>
        </div>
      )}
    </div>
  )
}
