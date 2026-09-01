import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

interface CardHeaderProps {
  title: string
  eyebrow?: string
  action?: React.ReactNode
  className?: string
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, eyebrow, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between px-6 py-4 ${className}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div>
        {eyebrow && (
          <p className="text-[#ef0e30] font-condensed font-semibold uppercase tracking-widest text-xs mb-1">
            {eyebrow}
          </p>
        )}
        <h3
          className="font-condensed font-semibold text-base uppercase tracking-wide"
          style={{ color: 'var(--text-primary, #fff)' }}
        >
          {title}
        </h3>
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}
