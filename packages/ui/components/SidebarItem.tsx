import React from 'react'

interface SidebarItemProps {
  icon?: React.ReactNode
  label: string
  badge?: string | number
  active?: boolean
  onClick?: () => void
  href?: string
  className?: string
}

export function SidebarItem({
  icon,
  label,
  badge,
  active = false,
  onClick,
  className = '',
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-150 text-left',
        active
          ? 'border-l-2 border-[#68a2b9] bg-[rgba(104,162,185,0.08)] text-[#68a2b9] pl-[10px]'
          : 'border-l-2 border-transparent text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]',
        className,
      ].join(' ')}
    >
      {icon && (
        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {icon}
        </span>
      )}
      <span className="font-condensed font-semibold uppercase tracking-wide text-sm flex-1 truncate">
        {label}
      </span>
      {badge !== undefined && badge !== null && (
        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#ef0e30] text-white text-xs font-condensed font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  )
}
