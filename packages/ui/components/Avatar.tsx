import React from 'react'

type AvatarSize = 'sm' | 'md' | 'lg'

interface AvatarProps {
  name?: string
  src?: string
  size?: AvatarSize
  backgroundColor?: string
  className?: string
}

const sizeStyles: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: 'w-8 h-8',  text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-14 h-14', text: 'text-lg' },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({
  name,
  src,
  size = 'md',
  backgroundColor = '#1b3c5a',
  className = '',
}: AvatarProps) {
  const { container, text } = sizeStyles[size]

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? 'Avatar'}
        className={`${container} rounded object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`${container} rounded flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ backgroundColor }}
    >
      <span className={`${text} font-condensed font-bold text-white`}>
        {name ? getInitials(name) : '?'}
      </span>
    </div>
  )
}
