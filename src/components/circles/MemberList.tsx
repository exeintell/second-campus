'use client'

import { useCircleContext } from './CircleProvider'
import { UserAvatar } from '@/components/ui/UserAvatar'

export function MemberList() {
  const { members, loading } = useCircleContext()

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
        >
          <UserAvatar username={member.users?.username} avatarUrl={member.users?.avatar_url} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {member.users?.username || '名前未設定'}
            </p>
            <p className="text-[10px] text-neutral-400 capitalize">
              {member.role}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
