'use client'

import { useCircleContext } from '@/components/circles/CircleProvider'
import { MemberList } from '@/components/circles/MemberList'

export default function CircleOverviewClient() {
  const { circle, channels, members, loading } = useCircleContext()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!circle) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        サークルが見つかりません
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      {/* Circle Info */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          {circle.name}
        </h1>
        {circle.description && (
          <p className="text-sm text-neutral-500">{circle.description}</p>
        )}
        <div className="flex gap-4 mt-3 text-sm text-neutral-500">
          <span>
            メンバー{' '}
            <span className="font-semibold text-accent-600 dark:text-accent-400">
              {members.length}
            </span>
          </span>
          <span>
            チャンネル{' '}
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
              {channels.length}
            </span>
          </span>
        </div>
      </div>

      {/* Members Section */}
      <div>
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          メンバー
        </h2>
        <MemberList />
      </div>
    </div>
  )
}
