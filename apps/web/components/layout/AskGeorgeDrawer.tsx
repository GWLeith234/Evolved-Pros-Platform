'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

interface AskGeorgeDrawerProps {
  isOpen: boolean
  onClose: () => void
}

// Third-party apigateway webchat SDK (George's embedded assistant). The SDK is
// served from cdn.apigateway.co (already CSP-allowed) and renders the widget
// into the element whose id matches data-embed-target.
const WEBCHAT_SDK_SRC = 'https://cdn.apigateway.co/webchat-client..prod/sdk.js'
const WEBCHAT_WIDGET_ID = '96dd7dbb-2a14-11f1-93eb-72103b668f62'
const WEBCHAT_CONTAINER_ID = 'ask-george-webchat'

export function AskGeorgeDrawer({ isOpen, onClose }: AskGeorgeDrawerProps) {
  // Lazy-mount the SDK + container on first open so the third-party webchat
  // script isn't loaded for members who never open the panel.
  const [hasOpened, setHasOpened] = useState(false)

  useEffect(() => {
    if (isOpen) setHasOpened(true)
  }, [isOpen])

  // While open, hide the fixed bottom tab bar (.ep-bottom-tabs, <lg only) so
  // the chat input + Send aren't clipped behind it. A body class keeps this in
  // one place and avoids fragile safe-area height math on notched phones.
  useEffect(() => {
    if (!isOpen) return
    document.body.classList.add('ask-george-open')
    return () => document.body.classList.remove('ask-george-open')
  }, [isOpen])

  // Escape key close
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
      {/* Backdrop — full viewport at every breakpoint. Sits below the drawer
          (z-40 < z-50) and above the page, so clicking outside closes the drawer
          and pointer events never reach page content (no accidental navigation). */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(10,15,24,0.5)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/*
        Mobile (<md):  full 100vw, starts below TopNav (top-14 = 56px), fills to the
                       viewport bottom. The bottom tab bar is hidden while open (see
                       the body-class effect), so nothing clips the input.
        Desktop (md+): 400px wide, anchored top-0, full height.
        100dvh (not 100vh) so mobile browser chrome is accounted for.
      */}
      <div
        className={[
          'fixed right-0 z-50 flex flex-col',
          'w-full top-14 h-[calc(100dvh-56px)]',
          'md:w-[400px] md:top-0 md:h-[100dvh]',
        ].join(' ')}
        style={{
          backgroundColor: 'var(--bg-page)',
          borderLeft: '1px solid var(--border-color)',
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
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  color: 'var(--text-primary)',
                  letterSpacing: '0.04em',
                }}
              >
                Ask George
              </span>
              <span
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 700,
                  fontSize: '12px',
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
                fontSize: '12px',
                color: 'var(--text-tertiary)',
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
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — George's embedded webchat widget fills the panel. */}
        <div
          className="flex-1 min-h-0 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-page)' }}
        >
          {hasOpened && (
            <div id={WEBCHAT_CONTAINER_ID} style={{ height: '100%', width: '100%' }} />
          )}
        </div>
      </div>

      {/* Load the webchat SDK once the panel has been opened. next/script
          forwards the data-* attributes to the injected <script>; the SDK reads
          them to render the widget into #ask-george-webchat. */}
      {hasOpened && (
        <Script
          src={WEBCHAT_SDK_SRC}
          strategy="afterInteractive"
          data-widget-id={WEBCHAT_WIDGET_ID}
          data-embed-mode="embedded"
          data-embed-target={WEBCHAT_CONTAINER_ID}
        />
      )}
    </>
  )
}
