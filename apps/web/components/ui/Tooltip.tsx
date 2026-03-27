'use client'

import { useState, useRef, useEffect, useId } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<'above' | 'below'>('above')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()

  function show() {
    timerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setPosition(rect.top < 80 ? 'below' : 'above')
      }
      setVisible(true)
    }, 300)
  }

  function hide() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return (
    <div
      ref={triggerRef}
      className={`relative ${className ?? 'inline-flex'}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <div aria-describedby={visible ? tooltipId : undefined} className={className ? 'block' : 'inline-flex'}>
        {children}
      </div>

      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute',
            ...(position === 'above'
              ? { bottom: 'calc(100% + 7px)' }
              : { top: 'calc(100% + 7px)' }),
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#112535',
            color: 'white',
            fontSize: '12px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 500,
            padding: '8px 12px',
            borderRadius: '5px',
            maxWidth: '220px',
            width: 'max-content',
            lineHeight: 1.45,
            zIndex: 9999,
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
          }}
        >
          {content}
          {/* Arrow */}
          <span
            style={{
              position: 'absolute',
              ...(position === 'above'
                ? { bottom: '-5px', borderTop: '5px solid #112535', borderBottom: 'none' }
                : { top: '-5px', borderBottom: '5px solid #112535', borderTop: 'none' }),
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
            }}
          />
        </div>
      )}
    </div>
  )
}
