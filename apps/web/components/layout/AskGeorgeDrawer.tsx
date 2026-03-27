'use client'

import { useEffect, useRef } from 'react'

const WIDGET_ID = '96dd7dbb-2a14-11f1-93eb-72103b668f62'
const SCRIPT_SRC = 'https://cdn.apigateway.co/webchat-client..prod/sdk.js'
const TARGET_ID = 'ask-george-widget'

interface AskGeorgeDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function AskGeorgeDrawer({ isOpen, onClose }: AskGeorgeDrawerProps) {
  const scriptInjected = useRef(false)

  // Inject the Vendasta widget script once the drawer first opens
  useEffect(() => {
    if (!isOpen || scriptInjected.current) return
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      scriptInjected.current = true
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.defer = true
    script.setAttribute('data-widget-id', WIDGET_ID)
    script.setAttribute('data-embed-mode', 'embedded')
    script.setAttribute('data-embed-target', TARGET_ID)
    document.body.appendChild(script)
    scriptInjected.current = true
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: 'rgba(13,28,39,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: 'min(400px, 100vw)',
          backgroundColor: '#112535',
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
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="font-condensed font-bold text-white text-[18px] tracking-[0.06em]">
              Ask George
            </span>
            <span
              className="font-condensed font-bold uppercase text-[9px] tracking-widest px-1.5 py-0.5 rounded"
              style={{
                color: '#68a2b9',
                backgroundColor: 'rgba(104,162,185,0.15)',
                border: '1px solid rgba(104,162,185,0.3)',
              }}
            >
              AI
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Ask George"
            className="w-8 h-8 flex items-center justify-center rounded transition-colors flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Widget container — Vendasta mounts into this div */}
        <div id={TARGET_ID} className="flex-1 min-h-0 w-full" />
      </div>
    </>
  )
}
