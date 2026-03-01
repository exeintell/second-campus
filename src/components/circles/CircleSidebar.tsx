'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCircleContext } from './CircleProvider'
import { useAuth } from '@/hooks/useAuth'
import { useChannels } from '@/hooks/useChannels'
import { CreateChannelDialog } from '@/components/channels/CreateChannelDialog'
import { DeleteChannelDialog } from '@/components/channels/DeleteChannelDialog'

export function CircleSidebar({ circleId }: { circleId: string }) {
  const { circle, channels, myChannelIds, loading, refetch } = useCircleContext()
  const { user } = useAuth()
  const { createChannel, deleteChannel, joinChannel } = useChannels()
  const pathname = usePathname()
  const router = useRouter()

  const isOwner = user && circle && circle.owner_id === user.id

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [joining, setJoining] = useState<string | null>(null)

  const myChannelIdSet = new Set(myChannelIds)
  const joinedChannels = channels.filter((c) => myChannelIdSet.has(c.id))
  const otherChannels = channels.filter((c) => !myChannelIdSet.has(c.id) && !c.is_private)

  const handleCreateChannel = async (name: string, description: string, isPrivate: boolean) => {
    await createChannel(circleId, name, description, isPrivate)
    await refetch()
  }

  const handleDeleteChannel = async () => {
    if (!deleteTarget) return
    const deletedId = deleteTarget.id
    await deleteChannel(deletedId)
    await refetch()
    if (pathname.includes(`/channels/${deletedId}`)) {
      router.push(`/circles/${circleId}`)
    }
  }

  const handleJoinChannel = async (channelId: string) => {
    setJoining(channelId)
    try {
      await joinChannel(channelId)
      await refetch()
    } finally {
      setJoining(null)
    }
  }

  const renderChannelItem = (channel: typeof channels[0], showJoinButton: boolean = false) => {
    const isActive = pathname === `/circles/${circleId}/channels/${channel.id}`
    const isJoined = myChannelIdSet.has(channel.id)

    return (
      <div
        key={channel.id}
        className={`group flex items-center mx-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
          isActive
            ? 'bg-accent-50 dark:bg-accent-950 text-accent-700 dark:text-accent-300 font-medium'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-surface-100 dark:hover:bg-surface-900'
        }`}
      >
        {isJoined ? (
          <Link
            href={`/circles/${circleId}/channels/${channel.id}`}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <span className="text-neutral-400">
              {channel.is_private ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : '#'}
            </span>
            <span className="truncate">{channel.name}</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-neutral-400">#</span>
            <span className="truncate">{channel.name}</span>
          </div>
        )}
        {showJoinButton && !isJoined && (
          <button
            onClick={() => handleJoinChannel(channel.id)}
            disabled={joining === channel.id}
            className="hidden group-hover:flex px-2 py-0.5 text-[10px] font-semibold bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white rounded transition-colors shrink-0"
          >
            {joining === channel.id ? '...' : '参加'}
          </button>
        )}
        {isOwner && isJoined && !channel.is_default && (
          <button
            onClick={(e) => {
              e.preventDefault()
              setDeleteTarget({ id: channel.id, name: channel.name })
            }}
            className="hidden group-hover:flex w-5 h-5 items-center justify-center rounded text-neutral-400 hover:text-red-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors shrink-0"
            title="チャンネルを削除"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Circle Header */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-800">
        <Link href={`/circles/${circleId}`} className="block">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {loading ? '...' : circle?.name}
          </h2>
          {circle?.description && (
            <p className="text-xs text-neutral-500 mt-0.5 truncate">
              {circle.description}
            </p>
          )}
        </Link>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Joined Channels */}
        <div className="px-3 mb-1 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            参加中
          </span>
          {isOwner && (
            <button
              onClick={() => setCreateOpen(true)}
              className="w-5 h-5 flex items-center justify-center rounded text-neutral-400 hover:text-accent-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title="チャンネルを追加"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
        {joinedChannels.map((channel) => renderChannelItem(channel))}

        {/* Other Public Channels */}
        {otherChannels.length > 0 && (
          <>
            <div className="px-3 mt-4 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                チャンネル一覧
              </span>
            </div>
            {otherChannels.map((channel) => renderChannelItem(channel, true))}
          </>
        )}
      </div>

      {/* Back Link */}
      <div className="p-3 border-t border-surface-200 dark:border-surface-800">
        <Link
          href="/circles"
          className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          サークル一覧に戻る
        </Link>
      </div>

      {/* Dialogs */}
      <CreateChannelDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateChannel}
      />
      <DeleteChannelDialog
        open={!!deleteTarget}
        channelName={deleteTarget?.name ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteChannel}
      />
    </div>
  )
}
