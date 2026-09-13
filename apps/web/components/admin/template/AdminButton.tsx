import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type AdminButtonVariant = 'primary' | 'secondary' | 'ghost'

const VARIANT_CLASS: Record<AdminButtonVariant, string> = {
  primary: 'ep-admin-el-btn ep-admin-el-btn--primary',
  secondary: 'ep-admin-el-btn',
  ghost: 'ep-admin-el-btn ep-admin-el-btn--ghost',
}

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AdminButtonVariant
  href?: string
  children: ReactNode
}

/** 44px touch control. Red primary, navy outline secondary, ghost cancel. */
export function AdminButton({
  variant = 'secondary',
  href,
  className = '',
  children,
  type = 'button',
  disabled,
  ...rest
}: AdminButtonProps) {
  const cls = `${VARIANT_CLASS[variant]} ${className}`.trim()
  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} className={cls} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}
