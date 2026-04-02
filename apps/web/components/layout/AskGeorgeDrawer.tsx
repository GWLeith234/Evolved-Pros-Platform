'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AskGeorgeDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const SUGGESTIONS = [
  'How do I build a WIG?',
  "What's my Pioneer type?",
  "I'm stuck on prospecting",
]

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 12px' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.4)',
            animation: `george-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

function GlAvatar({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #C9302A, #a02020)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: size > 24 ? '0 4px 16px rgba(201,48,42,0.3)' : undefined,
      }}
    >
      <span
        style={{
          fontFamily: '"Arial Black", Arial, sans-serif',
          fontWeight: 900,
          fontSize: size > 24 ? '14px' : '8px',
          color: 'white',
          letterSpacing: '-0.02em',
          userSelect: 'none',
        }}
      >
        GL
      </span>
    </div>
  )
}

export function AskGeorgeDrawer({ isOpen, onClose }: AskGeorgeDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Escape key close
  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, loading])

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ask-george', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
        }),
      })
      const data = await res.json() as { reply?: string; error?: string }
      const reply = data.reply ?? data.error ?? 'Sorry, something went wrong. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Unable to reach George right now. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }, [loading, messages])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <>
      <style>{`
        @keyframes george-dot-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      {/* Backdrop — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: 'rgba(13,28,39,0.7)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/*
        Mobile (<md):  full 100vw, starts below TopNav (top-14 = 56px), fills remaining height
        Desktop (md+): 400px wide, anchored top-0, full 100vh
      */}
      <div
        className={[
          'fixed right-0 z-50 flex flex-col',
          'w-full top-14 h-[calc(100vh-56px)]',
          'md:w-[400px] md:top-0 md:h-screen',
        ].join(' ')}
        style={{
          backgroundColor: '#0A0F18',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-8px 0 32px rgba(13,28,39,0.4)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
        }}
        aria-label="Ask George AI assistant"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{
            backgroundColor: '#111926',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  color: 'white',
                  letterSpacing: '0.04em',
                }}
              >
                Ask George
              </span>
              <span
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 700,
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#A78BFA',
                  backgroundColor: 'rgba(167,139,250,0.12)',
                  border: '1px solid rgba(167,139,250,0.3)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                AI
              </span>
            </div>
            <span
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.02em',
              }}
            >
              Trained on the EVOLVED framework · George Leith
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Ask George"
            className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat area */}
        <div
          ref={chatRef}
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ backgroundColor: '#0A0F18' }}
        >
          {!hasMessages ? (
            /* Empty state */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: '32px 24px',
                textAlign: 'center',
                gap: '16px',
              }}
            >
              <GlAvatar size={52} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p
                  style={{
                    fontFamily: '"Arial Black", Arial, sans-serif',
                    fontWeight: 900,
                    fontSize: '20px',
                    color: 'white',
                    margin: 0,
                  }}
                >
                  Ask me anything.
                </p>
                <p
                  style={{
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.4)',
                    lineHeight: 1.4,
                    maxWidth: '260px',
                    margin: 0,
                  }}
                >
                  Sales strategy, the EVOLVED framework, your pillars, lead measures — anything.
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setInput(s)}
                    style={{
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontSize: '10px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '20px',
                      padding: '5px 12px',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list */
            <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: '4px',
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '2px' }}>
                      <GlAvatar size={18} />
                      <span
                        style={{
                          fontFamily: '"Barlow Condensed", sans-serif',
                          fontWeight: 700,
                          fontSize: '10px',
                          color: '#C9A84C',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}
                      >
                        George
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: msg.role === 'user' ? '75%' : '85%',
                      padding: '8px 12px',
                      borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '2px 14px 14px 14px',
                      backgroundColor: msg.role === 'user' ? '#C9302A' : '#1a2535',
                      color: msg.role === 'user' ? 'white' : 'rgba(255,255,255,0.85)',
                      border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      fontFamily: '"Barlow", sans-serif',
                      fontSize: '12px',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '2px' }}>
                    <GlAvatar size={18} />
                    <span
                      style={{
                        fontFamily: '"Barlow Condensed", sans-serif',
                        fontWeight: 700,
                        fontSize: '10px',
                        color: '#C9A84C',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      George
                    </span>
                  </div>
                  <div
                    style={{
                      backgroundColor: '#1a2535',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '2px 14px 14px 14px',
                    }}
                  >
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input row */}
        <div
          style={{
            backgroundColor: '#111926',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask George anything…"
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: '#0A0F18',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '9px 14px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '12px',
              fontFamily: '"Barlow", sans-serif',
              outline: 'none',
              minWidth: 0,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: loading || !input.trim() ? 'rgba(201,48,42,0.4)' : '#C9302A',
              border: 'none',
              cursor: loading || !input.trim() ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background-color 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
