import React from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'teal'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: React.ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-[#ef0e30] hover:bg-[#c50a26] text-white border border-[#ef0e30] hover:border-[#c50a26]',
  outline: 'bg-transparent hover:bg-[rgba(27,60,90,0.06)] text-[#1b3c5a] border border-[#1b3c5a]',
  ghost:   'bg-transparent hover:bg-[rgba(255,255,255,0.08)] text-white border border-[rgba(255,255,255,0.2)]',
  teal:    'bg-[#68a2b9] hover:bg-[#5a8fa4] text-white border border-[#68a2b9] hover:border-[#5a8fa4]',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded font-condensed font-semibold uppercase tracking-wide transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-[#68a2b9] focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
