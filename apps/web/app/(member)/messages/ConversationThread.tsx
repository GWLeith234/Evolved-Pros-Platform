'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useToast } from '@/lib/toast'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  read_at: string | null
  created_at: string
}

interface ConversationThreadProps {
  conversationId: string
  currentUserId: string
}

type Cursor = { createdAt: string; id: string }

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function ConversationThread({ conversationId, currentUserId }: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<Cursor | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())
  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { showToast } = useToast()

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Initial page (latest 50)
  useEffect(() => {
    setLoading(true)
    setMessages([])
    setNextCursor(null)
    setHasMore(false)
    stickToBottom.current = true
    fetch(`/api/conversations/${conversationId}/messages?limit=50`)
      .then(r => r.json())
      .then(data => {
        setMessages(data.messages ?? [])
        setNextCursor(data.nextCursor ?? null)
        setHasMore(Boolean(data.hasMore))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [conversationId])

  // Only auto-scroll when pinned to bottom (new messages / send), not when prepending history.
  useEffect(() => {
    if (stickToBottom.current) scrollToBottom()
  }, [messages, scrollToBottom])

  const loadOlder = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingOlder) return
    const el = listRef.current
    const prevHeight = el?.scrollHeight ?? 0
    const prevTop = el?.scrollTop ?? 0
    setLoadingOlder(true)
    stickToBottom.current = false
    try {
      const qs = new URLSearchParams({
        limit: '50',
        beforeCreatedAt: nextCursor.createdAt,
        beforeId: nextCursor.id,
      })
      const res = await fetch(`/api/conversations/${conversationId}/messages?${qs}`)
      if (!res.ok) return
      const data = await res.json() as {
        messages: Message[]
        nextCursor: Cursor | null
        hasMore: boolean
      }
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id))
        const older = (data.messages ?? []).filter(m => !ids.has(m.id))
        return [...older, ...prev]
      })
      setNextCursor(data.nextCursor ?? null)
      setHasMore(Boolean(data.hasMore))
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight + prevTop
      })
    } finally {
      setLoadingOlder(false)
    }
  }, [conversationId, hasMore, nextCursor, loadingOlder])

  // Realtime — append + PATCH mark-read (no full history refetch)
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let client: any = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null

    void (async () => {
      const { createClient: createBrowserClient } = await import('@/lib/supabase/client')
      if (cancelled) return
      client = createBrowserClient()
      channel = client
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            const newMsg = payload.new as Message
            stickToBottom.current = true
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
            if (newMsg.sender_id !== currentUserId) {
              void fetch(`/api/conversations/${conversationId}/messages`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId: newMsg.id }),
              }).catch(() => {})
              window.dispatchEvent(new CustomEvent('dm-unread-changed'))
            }
          }
        )
        .subscribe()
    })()

    return () => {
      cancelled = true
      if (client && channel) client.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

  async function handleSend() {
    const trimmed = inputValue.trim()
    if (!trimmed || sending) return

    setSending(true)
    setInputValue('')
    stickToBottom.current = true

    const optimisticId = `optimistic-${Date.now()}`
    const optimistic: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: trimmed,
      read_at: null,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setPendingIds(prev => {
      const next = new Set(prev)
      next.add(optimisticId)
      return next
    })

    const clearPending = () => setPendingIds(prev => {
      const next = new Set(prev)
      next.delete(optimisticId)
      return next
    })

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => prev.map(m => m.id === optimisticId ? msg : m))
        clearPending()
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimisticId))
        clearPending()
        setInputValue(trimmed)
        showToast('Couldn’t send message. Try again.', 'error')
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      clearPending()
      setInputValue(trimmed)
      showToast('Network error. Message not sent.', 'error')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="font-condensed text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Loading…
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {hasMore && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={() => { void loadOlder() }}
              disabled={loadingOlder}
              className="font-condensed text-[10px] uppercase tracking-widest px-3 py-1 rounded"
              style={{
                color: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.12)',
                opacity: loadingOlder ? 0.5 : 1,
              }}
            >
              {loadingOlder ? 'Loading…' : 'Load older messages'}
            </button>
          </div>
        )}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <span className="font-condensed text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No messages yet. Say hello!
            </span>
          </div>
        )}
        {messages.map(m => {
          const isMine = m.sender_id === currentUserId
          const isPending = pendingIds.has(m.id)
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[70%] rounded-xl px-3 py-2 text-sm font-body break-words"
                title={formatDate(m.created_at)}
                style={{
                  backgroundColor: isMine ? '#1b3c5a' : '#0d1e2c',
                  color: isMine ? 'white' : 'rgba(255,255,255,0.85)',
                  borderBottomRightRadius: isMine ? '4px' : undefined,
                  borderBottomLeftRadius: !isMine ? '4px' : undefined,
                  opacity: isPending ? 0.55 : 1,
                  transition: 'opacity 120ms ease',
                }}
              >
                {m.body}
                <div
                  className="text-[10px] mt-0.5 opacity-50 text-right"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                  aria-live={isPending ? 'polite' : undefined}
                >
                  {isPending ? 'Sending…' : formatTime(m.created_at)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div
        className="flex-shrink-0 px-4 py-3 flex items-end gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className="flex-1 resize-none rounded-lg px-3 py-2 text-sm font-body outline-none"
          style={{
            backgroundColor: 'rgba(255,255,255,0.08)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.12)',
            maxHeight: '120px',
            lineHeight: '1.5',
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!inputValue.trim() || sending}
          aria-busy={sending}
          className="flex-shrink-0 px-4 py-2 rounded-lg font-condensed font-bold uppercase tracking-wide text-xs transition-opacity"
          style={{
            backgroundColor: '#68a2b9',
            color: 'white',
            opacity: !inputValue.trim() || sending ? 0.4 : 1,
          }}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
