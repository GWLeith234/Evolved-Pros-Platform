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
      className={`bg-white border border-[rgba(27,60,90,0.12)] rounded-lg overflow-hidden ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, eyebrow, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between px-6 py-4 border-b border-[rgba(27,60,90,0.08)] ${className}`}>
      <div>
        {eyebrow && (
          <p className="text-[#ef0e30] font-condensed font-semibold uppercase tracking-widest text-xs mb-1">
            {eyebrow}
          </p>
        )}
        <h3 className="font-condensed font-semibold text-[#1b3c5a] text-base uppercase tracking-wide">
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
