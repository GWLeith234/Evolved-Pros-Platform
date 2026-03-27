'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch messages on mount or when conversationId changes
  useEffect(() => {
    setLoading(true)
    setMessages([])
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(r => r.json())
      .then(data => {
        setMessages(data.messages ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [conversationId])

  // Scroll to bottom when messages load/change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Supabase realtime subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            // Avoid duplicates (optimistic update may already have it)
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Mark as read if from other user
          if (newMsg.sender_id !== currentUserId) {
            fetch(`/api/conversations/${conversationId}/messages`, {
              method: 'GET',
            }).catch(() => {})
          }
        }
      )
      .subscribe()

    // Global messages subscription to emit unread changed event
    const globalChannel = supabase
      .channel('messages:global:inserts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message
          if (newMsg.sender_id !== currentUserId) {
            window.dispatchEvent(new CustomEvent('dm-unread-changed'))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(globalChannel)
    }
  }, [conversationId, currentUserId])

  async function handleSend() {
    const trimmed = inputValue.trim()
    if (!trimmed || sending) return

    setSending(true)
    setInputValue('')

    // Optimistic update
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

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      })
      if (res.ok) {
        const msg = await res.json()
        // Replace optimistic message with real one
        setMessages(prev => prev.map(m => m.id === optimisticId ? msg : m))
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticId))
        setInputValue(trimmed)
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      setInputValue(trimmed)
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

  // Auto-resize textarea
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
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <span className="font-condensed text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No messages yet. Say hello!
            </span>
          </div>
        )}
        {messages.map(m => {
          const isMine = m.sender_id === currentUserId
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
                }}
              >
                {m.body}
                <div
                  className="text-[10px] mt-0.5 opacity-50 text-right"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {formatTime(m.created_at)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
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
          className="flex-shrink-0 px-4 py-2 rounded-lg font-condensed font-bold uppercase tracking-wide text-xs transition-opacity"
          style={{
            backgroundColor: '#68a2b9',
            color: 'white',
            opacity: !inputValue.trim() || sending ? 0.4 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
