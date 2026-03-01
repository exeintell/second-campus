'use client'

import { useState } from 'react'
import Image from 'next/image'

const sizeClasses = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
} as const

const sizePx = { xs: 24, sm: 28, md: 32, lg: 40 } as const

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
  const px = sizePx[size]
  const initial = (username || '?').charAt(0).toUpperCase()

  if (avatarUrl && !imgError) {
    return (
      <Image
        src={avatarUrl}
        alt={username || 'avatar'}
        width={px}
        height={px}
        className={`${sizeClass.split(' ').slice(0, 2).join(' ')} rounded-full object-cover shrink-0 ${className}`}
        unoptimized
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
