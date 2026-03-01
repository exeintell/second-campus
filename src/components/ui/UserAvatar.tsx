'use client'

import { useState } from 'react'

const sizeClasses = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
} as const

type AvatarSize = keyof typeof sizeClasses

interface UserAvatarProps {
  username: string | null | undefined
  avatarUrl: string | null | undefined
  size?: AvatarSize
  className?: string
}

export function UserAvatar({ username, avatarUrl, size = 'md', className = '' }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const sizeClass = sizeClasses[size]
  const initial = (username || '?').charAt(0).toUpperCase()

  if (avatarUrl && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={username || 'avatar'}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${className}`}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div className={`${sizeClass} bg-accent-100 dark:bg-accent-900 rounded-full flex items-center justify-center shrink-0 ${className}`}>
      <span className="text-accent-600 dark:text-accent-400 font-semibold">
        {initial}
      </span>
    </div>
  )
}
