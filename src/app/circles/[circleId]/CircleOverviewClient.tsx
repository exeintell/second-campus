'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCircleContext } from '@/components/circles/CircleProvider'
import { MemberList } from '@/components/circles/MemberList'
import { InviteCodeDisplay } from '@/components/circles/InviteCodeDisplay'
import { JoinRequestList } from '@/components/circles/JoinRequestList'
import { DeleteCircleDialog } from '@/components/circles/DeleteCircleDialog'
import { EventList } from '@/components/events/EventList'
import { useAuth } from '@/hooks/useAuth'
import { useCircles } from '@/hooks/useCircles'

export default function CircleOverviewClient() {
  const { circle, channels, members, loading } = useCircleContext()
  const { user } = useAuth()
  const { deleteCircle } = useCircles()
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isOwner = user && circle && circle.owner_id === user.id

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

      {/* Events Section */}
      <EventList circleId={circle.id} />

      {/* Owner: Invite Code & Join Requests */}
      {isOwner && (
        <div className="mt-8 space-y-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            管理
          </h2>
          <InviteCodeDisplay circleId={circle.id} />
          <JoinRequestList circleId={circle.id} />

          {/* Danger Zone */}
          <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800">
            <h3 className="text-sm font-semibold text-red-500 mb-3">危険な操作</h3>
            <button
              onClick={() => setDeleteOpen(true)}
              className="px-4 py-2 text-sm font-medium text-red-500 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
            >
              サークルを削除
            </button>
          </div>
        </div>
      )}

      {/* Delete Circle Dialog */}
      <DeleteCircleDialog
        open={deleteOpen}
        circleName={circle.name}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteCircle(circle.id)
          router.push('/circles')
        }}
      />
    </div>
  )
}
