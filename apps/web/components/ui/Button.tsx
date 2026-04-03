'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
  onClick?: () => void
  href?: string
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

const BASE_STYLE: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'opacity 0.15s, background-color 0.15s',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  textDecoration: 'none',
  lineHeight: 1,
}

const VARIANT_BASE: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { backgroundColor: '#C9302A', color: '#ffffff', border: 'none' },
  secondary: { backgroundColor: 'transparent', color: '#C9A84C', border: '1px solid #C9A84C' },
  tertiary:  { backgroundColor: 'transparent', color: '#0ABFA3', border: 'none' },
  ghost:     { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' },
}

const VARIANT_HOVER: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { opacity: 0.9 },
  secondary: { backgroundColor: 'rgba(201,168,76,0.1)' },
  tertiary:  { opacity: 0.8 },
  ghost:     { backgroundColor: 'rgba(255,255,255,0.1)' },
}

const SIZE_STYLE: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '5px 12px', fontSize: '10px' },
  md: { padding: '8px 16px', fontSize: '11px' },
  lg: { padding: '10px 24px', fontSize: '12px' },
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  href,
  disabled,
  loading,
  fullWidth,
  className,
  type = 'button',
}: ButtonProps) {
  const [hovered, setHovered] = useState(false)
  const isDisabled = disabled || loading

  const style: React.CSSProperties = {
    ...BASE_STYLE,
    ...VARIANT_BASE[variant],
    ...SIZE_STYLE[size],
    ...(hovered && !isDisabled ? VARIANT_HOVER[variant] : {}),
    ...(fullWidth ? { width: '100%' } : {}),
    ...(isDisabled ? { opacity: 0.45, cursor: 'not-allowed' } : {}),
  }

  const content = variant === 'tertiary' ? <>{children} →</> : children

  if (href && !isDisabled) {
    return (
      <Link
        href={href}
        style={style}
        className={className}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={style}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {loading ? '...' : content}
    </button>
  )
}
