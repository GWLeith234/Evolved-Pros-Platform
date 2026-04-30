'use client'

import { useEffect, useRef, useState } from 'react'

export interface TickerItem {
  id: string
  text: string
  timestamp: string
  emoji?: string
}

interface TickerProps {
  items?: TickerItem[]
  speedPxPerSec?: number
}

// MR1 placeholder data — Vendasta CRM event wiring lands in MR2.
const PLACEHOLDER_ITEMS: ReadonlyArray<TickerItem> = [
  { id: 'p-1', text: 'Sarah K. from Toronto just joined Evolved Pros', timestamp: '2m ago', emoji: '👋' },
  { id: 'p-2', text: 'David M. from Saskatoon just upgraded to Evolved VIP', timestamp: '7m ago', emoji: '⭐' },
  { id: 'p-3', text: 'Priya N. from Mumbai just joined Evolved Pros', timestamp: '14m ago', emoji: '👋' },
  { id: 'p-4', text: 'James W. from Austin just upgraded to Evolved Pro', timestamp: '23m ago', emoji: '⭐' },
  { id: 'p-5', text: 'Lena P. from Berlin just joined Evolved Pros', timestamp: '38m ago', emoji: '👋' },
  { id: 'p-6', text: 'Marcus T. from Brooklyn just upgraded to Evolved VIP', timestamp: '52m ago', emoji: '⭐' },
]

export function Ticker({ items, speedPxPerSec = 60 }: TickerProps) {
  const data = items && items.length > 0 ? items : (PLACEHOLDER_ITEMS as TickerItem[])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const setRef = useRef<HTMLSpanElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const offsetRef = useRef<number>(0)
  const setWidthRef = useRef<number>(0)
  const hoverRef = useRef<boolean>(false)
  const visibleRef = useRef<boolean>(true)

  const [reducedMotion, setReducedMotion] = useState<boolean>(false)
  const [pageIndex, setPageIndex] = useState<number>(0)

  // ── Reduced-motion media query (controls render branch) ──
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mql.matches)
    const onChange = () => setReducedMotion(mql.matches)
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange)
    } else {
      mql.addListener(onChange)
    }
    return () => {
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', onChange)
      } else {
        mql.removeListener(onChange)
      }
    }
  }, [])

  // ── Auto-scroll RAF loop (only when motion is allowed) ──
  useEffect(() => {
    if (reducedMotion) return
    const container = containerRef.current
    const track = trackRef.current
    const firstSet = setRef.current
    if (!container || !track || !firstSet) return

    const measure = () => {
      setWidthRef.current = firstSet.offsetWidth
    }
    measure()

    const tick = (t: number) => {
      const dt = lastTimeRef.current === 0 ? 0 : (t - lastTimeRef.current) / 1000
      lastTimeRef.current = t
      if (!hoverRef.current && visibleRef.current) {
        offsetRef.current -= dt * speedPxPerSec
        const setW = setWidthRef.current
        if (setW > 0 && -offsetRef.current >= setW) {
          offsetRef.current += setW
        }
        track.style.transform = `translate3d(${offsetRef.current.toFixed(2)}px, 0, 0)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    const start = () => {
      if (rafRef.current != null) return
      // Reset dt sentinel so resume frames don't jump by accumulated wall-time.
      lastTimeRef.current = 0
      rafRef.current = requestAnimationFrame(tick)
    }
    const stop = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }

    const onEnter = () => {
      hoverRef.current = true
      lastTimeRef.current = 0
    }
    const onLeave = () => {
      hoverRef.current = false
      lastTimeRef.current = 0
    }
    container.addEventListener('mouseenter', onEnter)
    container.addEventListener('mouseleave', onLeave)

    const io = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return
        visibleRef.current = entry.intersectionRatio > 0
        lastTimeRef.current = 0
      },
      { threshold: [0, 0.1] },
    )
    io.observe(container)

    const ro = new ResizeObserver(() => {
      measure()
    })
    ro.observe(firstSet)

    start()

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      container.removeEventListener('mouseenter', onEnter)
      container.removeEventListener('mouseleave', onLeave)
    }
  }, [reducedMotion, speedPxPerSec, data])

  // ── Render: static paginated control for reduced-motion users ──
  if (reducedMotion) {
    const current = data[pageIndex] ?? data[0]
    return (
      <div
        role="region"
        aria-label="Evolved Pros activity feed"
        style={{
          background: 'var(--ed-text, #1B2A4A)',
          color: 'var(--ed-bg, #F5F0E8)',
          borderBottom: '1px solid var(--ed-text, #1B2A4A)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'stretch',
            minHeight: 32,
          }}
        >
          <span style={tagStyle}>
            <span style={dotStyle} />
            On the Desk
          </span>
          <div
            aria-live="polite"
            aria-atomic="false"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '0 16px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 500,
              fontSize: 12,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(245,240,232,0.85)',
              minWidth: 0,
            }}
          >
            {current.emoji && <span aria-hidden="true">{current.emoji}</span>}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {current.text}
            </span>
            <span style={{ opacity: 0.55 }}>{current.timestamp}</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <button
              type="button"
              aria-label="Previous activity item"
              onClick={() => setPageIndex(i => (i - 1 + data.length) % data.length)}
              style={navBtnStyle}
            >
              ‹
            </button>
            <span
              aria-hidden="true"
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: 10,
                letterSpacing: '0.22em',
                color: 'rgba(245,240,232,0.55)',
                padding: '0 6px',
              }}
            >
              {pageIndex + 1}/{data.length}
            </span>
            <button
              type="button"
              aria-label="Next activity item"
              onClick={() => setPageIndex(i => (i + 1) % data.length)}
              style={navBtnStyle}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: auto-scrolling marquee (default) ──
  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Evolved Pros activity feed"
      style={{
        background: 'var(--ed-text, #1B2A4A)',
        color: 'var(--ed-bg, #F5F0E8)',
        borderBottom: '1px solid var(--ed-text, #1B2A4A)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'stretch',
          height: 32,
        }}
      >
        <span style={tagStyle}>
          <span style={dotStyle} />
          On the Desk
        </span>
        <div
          aria-live="polite"
          aria-atomic="false"
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          <div
            ref={trackRef}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              willChange: 'transform',
              whiteSpace: 'nowrap',
            }}
          >
            <span ref={setRef} style={setStyle}>
              {data.map((item, i) => (
                <TickerEntry key={`a-${item.id}`} item={item} first={i === 0} />
              ))}
            </span>
            {/* Duplicate set so the loop can wrap seamlessly. aria-hidden so SR
                doesn't read the same items twice. */}
            <span aria-hidden="true" style={setStyle}>
              {data.map(item => (
                <TickerEntry key={`b-${item.id}`} item={item} first={false} />
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TickerEntry({ item, first }: { item: TickerItem; first: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 500,
        fontSize: 12,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'rgba(245,240,232,0.85)',
      }}
    >
      {!first && <span style={{ opacity: 0.4 }}>◆</span>}
      {item.emoji && <span aria-hidden="true">{item.emoji}</span>}
      <span>{item.text}</span>
      <span style={{ opacity: 0.55 }}>{item.timestamp}</span>
    </span>
  )
}

const setStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
}

const tagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 14px',
  background: 'var(--ed-red, #C9302A)',
  color: '#fff',
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 800,
  fontSize: 10,
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  flexShrink: 0,
}

const dotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  background: '#fff',
  borderRadius: '50%',
}

const navBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  padding: 0,
  background: 'transparent',
  border: 'none',
  color: 'rgba(245,240,232,0.85)',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  fontFamily: 'inherit',
}
