import Link from 'next/link'
import React from 'react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: ReadonlyArray<BreadcrumbItem>
  className?: string
}

const sepStyle: React.CSSProperties = {
  color: 'rgba(27,60,90,0.30)',
  fontSize: 11,
  margin: '0 6px',
}

const linkStyle: React.CSSProperties = {
  color: 'rgba(27,60,90,0.65)',
  textDecoration: 'none',
}

const lastStyle: React.CSSProperties = {
  color: 'rgba(27,60,90,0.95)',
  fontWeight: 600,
}

const ARROW = '‹'

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      <ol style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {i > 0 && <span aria-hidden="true" style={sepStyle}>{ARROW}</span>}
              {item.href && !isLast ? (
                <Link href={item.href} style={linkStyle}>{item.label}</Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} style={isLast ? lastStyle : linkStyle}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export interface BackLinkProps {
  href: string
  label: string
  className?: string
}

export function BackLink({ href, label, className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: '"Barlow Condensed", sans-serif',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'rgba(27,60,90,0.65)',
        textDecoration: 'none',
      }}
    >
      <span aria-hidden="true">{ARROW}</span>
      {label}
    </Link>
  )
}
