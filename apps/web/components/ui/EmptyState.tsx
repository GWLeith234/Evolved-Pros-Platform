import Link from 'next/link'
import React from 'react'

interface EmptyStateAction {
  label: string
  href: string
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  body?: string
  action?: EmptyStateAction
  className?: string
}

export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        gap: 12,
      }}
    >
      {icon && (
        <div
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 999,
            background: 'rgba(27,60,90,0.06)',
            color: 'rgba(27,60,90,0.45)',
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          margin: 0,
          fontFamily: 'Georgia, serif',
          fontSize: 18,
          fontWeight: 600,
          color: 'rgba(27,60,90,0.95)',
        }}
      >
        {title}
      </h3>
      {body && (
        <p
          style={{
            margin: 0,
            maxWidth: 360,
            fontFamily: 'system-ui, sans-serif',
            fontSize: 13,
            lineHeight: 1.55,
            color: 'rgba(27,60,90,0.55)',
          }}
        >
          {body}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          style={{
            marginTop: 8,
            display: 'inline-block',
            padding: '8px 16px',
            background: 'var(--brand-red, #ef0e30)',
            color: '#fff',
            borderRadius: 4,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
