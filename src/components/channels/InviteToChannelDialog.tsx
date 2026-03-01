'use client'

import { useState } from 'react'
import { useCircleContext } from '@/components/circles/CircleProvider'
import { useChannels } from '@/hooks/useChannels'
import { UserAvatar } from '@/components/ui/UserAvatar'

interface InviteToChannelDialogProps {
  open: boolean
  onClose: () => void
  channelId: string
  existingMemberIds: string[]
}

export function InviteToChannelDialog({
  open,
  onClose,
  channelId,
  existingMemberIds,
}: InviteToChannelDialogProps) {
  const { members, refetch } = useCircleContext()
  const { inviteToChannel } = useChannels()
  const [inviting, setInviting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const existingSet = new Set(existingMemberIds)
  const invitable = members.filter((m) => !existingSet.has(m.user_id))

  const handleInvite = async (userId: string) => {
    setInviting(userId)
    setError(null)
    try {
      await inviteToChannel(channelId, userId)
      await refetch()
      // Remove from list by closing and reopening parent
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '招待に失敗しました'
      setError(msg)
    } finally {
      setInviting(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-white dark:bg-surface-900 rounded-xl shadow-xl">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            メンバーを招待
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 text-neutral-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="px-4 pt-3">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        <div className="max-h-64 overflow-y-auto">
          {invitable.length === 0 ? (
            <div className="p-4 text-center text-sm text-neutral-500">
              招待可能なメンバーがいません
            </div>
          ) : (
            invitable.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 p-3 hover:bg-surface-50 dark:hover:bg-surface-800">
                <UserAvatar username={m.users?.username} avatarUrl={m.users?.avatar_url} size="md" />
                <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {m.users?.username || '名前未設定'}
                </span>
                <button
                  onClick={() => handleInvite(m.user_id)}
                  disabled={inviting === m.user_id}
                  className="px-2.5 py-1 text-xs font-semibold bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white rounded-md transition-colors"
                >
                  {inviting === m.user_id ? '...' : '招待'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
