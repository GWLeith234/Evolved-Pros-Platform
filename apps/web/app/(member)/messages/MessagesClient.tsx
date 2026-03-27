'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ConversationThread } from './ConversationThread'

interface Conversation {
  id: string
  lastMessageAt: string | null
  createdAt: string
  otherParticipant: {
    id: string
    displayName: string
    avatarUrl: string | null
  }
  lastMessageBody: string | null
  lastMessageAt2: string | null
  unreadCount: number
}

interface CurrentUser {
  id: string
  displayName: string
  avatarUrl: string | null
}

interface Member {
  id: string
  displayName: string
  avatarUrl: string | null
  roleTitle: string | null
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function Avatar({ url, name, size = 36 }: { url: string | null; name: string; size?: number }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#1b3c5a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: '#68a2b9',
          fontSize: size * 0.35,
          fontWeight: 700,
          fontFamily: 'var(--font-condensed, sans-serif)',
        }}
      >
        {getInitials(name)}
      </span>
    </div>
  )
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function MessagesClient({
  initialConversations,
  currentUser,
}: {
  initialConversations: Conversation[]
  currentUser: CurrentUser
}) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')
  const [newMessageOpen, setNewMessageOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState<Member[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [startingConv, setStartingConv] = useState(false)

  // Auto-select conversation from ?c= param
  useEffect(() => {
    const cParam = searchParams.get('c')
    if (cParam) {
      setSelectedId(cParam)
    }
  }, [searchParams])

  // Refresh conversation list from API
  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations ?? [])
      }
    } catch {
      // ignore
    }
  }, [])

  // Listen for dm-unread-changed events to refresh list
  useEffect(() => {
    function handleUnreadChanged() {
      refreshConversations()
    }
    window.addEventListener('dm-unread-changed', handleUnreadChanged)
    return () => window.removeEventListener('dm-unread-changed', handleUnreadChanged)
  }, [refreshConversations])

  // Search members
  useEffect(() => {
    if (!memberSearch.trim()) {
      setMemberResults([])
      return
    }
    setSearchLoading(true)
    const q = memberSearch.trim()
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/members?search=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          // Exclude self
          const members = (data.members ?? []).filter((m: Member) => m.id !== currentUser.id)
          setMemberResults(members)
        }
      } catch {
        // ignore
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [memberSearch, currentUser.id])

  async function handleStartConversation(memberId: string) {
    if (startingConv) return
    setStartingConv(true)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: memberId }),
      })
      if (res.ok) {
        const conv = await res.json()
        setNewMessageOpen(false)
        setMemberSearch('')
        setMemberResults([])
        await refreshConversations()
        setSelectedId(conv.id)
        router.replace(`/messages?c=${conv.id}`)
      }
    } catch {
      // ignore
    } finally {
      setStartingConv(false)
    }
  }

  function handleSelectConversation(id: string) {
    setSelectedId(id)
    setMobileView('thread')
    router.replace(`/messages?c=${id}`)
    // Mark as read in local state immediately
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c)
    )
  }

  const selectedConv = conversations.find(c => c.id === selectedId)

  return (
    <div className="flex h-full" style={{ backgroundColor: '#0d1e2c' }}>
      {/* Left pane */}
      <div
        className={`flex-col flex-shrink-0 w-full md:w-72 ${mobileView === 'thread' ? 'hidden md:flex' : 'flex'}`}
        style={{
          backgroundColor: '#112535',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2
            className="font-condensed font-bold uppercase tracking-[0.14em] text-[13px]"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            Direct Messages
          </h2>
          <button
            type="button"
            onClick={() => setNewMessageOpen(true)}
            className="px-2 py-1 rounded text-[11px] font-condensed font-bold uppercase tracking-wide transition-opacity"
            style={{ backgroundColor: '#68a2b9', color: 'white' }}
            title="New Message"
          >
            + New
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="font-condensed text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No conversations yet
              </p>
            </div>
          )}
          {conversations.map(conv => {
            const isActive = conv.id === selectedId
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => handleSelectConversation(conv.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                  borderLeft: isActive ? '2px solid #68a2b9' : '2px solid transparent',
                  paddingLeft: isActive ? '14px' : '16px',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }}
              >
                <Avatar url={conv.otherParticipant.avatarUrl} name={conv.otherParticipant.displayName} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="font-condensed font-semibold text-[13px] truncate"
                      style={{ color: isActive ? '#68a2b9' : 'rgba(255,255,255,0.85)' }}
                    >
                      {conv.otherParticipant.displayName}
                    </span>
                    {(conv.lastMessageAt2 || conv.lastMessageAt) && (
                      <span className="text-[10px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {formatRelativeTime(conv.lastMessageAt2 ?? conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    {conv.lastMessageBody && (
                      <span
                        className="text-[11px] truncate font-body"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        {conv.lastMessageBody}
                      </span>
                    )}
                    {conv.unreadCount > 0 && (
                      <span
                        className="flex-shrink-0 min-w-[16px] h-[16px] px-1 rounded-full font-condensed font-bold text-[9px] text-white flex items-center justify-center"
                        style={{ backgroundColor: '#ef0e30' }}
                      >
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right pane */}
      <div className={`flex-1 flex-col min-w-0 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {!selectedId && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p
                className="font-condensed font-semibold uppercase tracking-[0.14em] text-[14px] mb-2"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Select a conversation or start a new one
              </p>
              <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Click &quot;+ New&quot; to message a member directly
              </p>
            </div>
          </div>
        )}

        {selectedId && (
          <>
            {/* Thread header */}
            {selectedConv && (
              <div
                className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Back button — mobile only */}
                <button
                  type="button"
                  className="md:hidden flex items-center gap-1 font-condensed font-semibold text-[12px] uppercase tracking-wide flex-shrink-0"
                  style={{ color: '#68a2b9' }}
                  onClick={() => { setMobileView('list'); setSelectedId(null); router.replace('/messages') }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back
                </button>
                <Avatar url={selectedConv.otherParticipant.avatarUrl} name={selectedConv.otherParticipant.displayName} size={32} />
                <span
                  className="font-condensed font-bold text-[14px]"
                  style={{ color: 'rgba(255,255,255,0.9)' }}
                >
                  {selectedConv.otherParticipant.displayName}
                </span>
              </div>
            )}
            <ConversationThread
              conversationId={selectedId}
              currentUserId={currentUser.id}
            />
          </>
        )}
      </div>

      {/* New Message Modal */}
      {newMessageOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => { setNewMessageOpen(false); setMemberSearch(''); setMemberResults([]) }}
        >
          <div
            className="w-full max-w-md mx-4 rounded-xl overflow-hidden"
            style={{ backgroundColor: '#112535', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3
                className="font-condensed font-bold uppercase tracking-[0.14em] text-[14px]"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                New Message
              </h3>
            </div>

            <div className="px-5 py-3">
              <input
                type="text"
                autoFocus
                placeholder="Search members…"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-body outline-none"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />
            </div>

            <div className="max-h-64 overflow-y-auto">
              {searchLoading && (
                <div className="px-5 py-3">
                  <p className="font-condensed text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Searching…
                  </p>
                </div>
              )}
              {!searchLoading && memberSearch && memberResults.length === 0 && (
                <div className="px-5 py-3">
                  <p className="font-condensed text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    No members found
                  </p>
                </div>
              )}
              {memberResults.map(member => (
                <button
                  key={member.id}
                  type="button"
                  disabled={startingConv}
                  onClick={() => handleStartConversation(member.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Avatar url={member.avatarUrl} name={member.displayName} size={36} />
                  <div>
                    <p className="font-condensed font-semibold text-[13px]">{member.displayName}</p>
                    {member.roleTitle && (
                      <p className="font-body text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {member.roleTitle}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                type="button"
                onClick={() => { setNewMessageOpen(false); setMemberSearch(''); setMemberResults([]) }}
                className="font-condensed text-[12px] uppercase tracking-wide"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
