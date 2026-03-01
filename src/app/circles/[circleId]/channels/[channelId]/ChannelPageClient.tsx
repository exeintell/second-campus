'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { useSendMessage } from '@/hooks/useSendMessage'
import { useCircleContext } from '@/components/circles/CircleProvider'
import { useChannels } from '@/hooks/useChannels'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { ChannelMemberList } from '@/components/channels/ChannelMemberList'
import { useRouteParam } from '@/hooks/useRouteParam'

export default function ChannelPageClient() {
  const channelId = useRouteParam('channelId', 'channels')
  const { user } = useAuth()
  const { channels, myChannelIds, circle, refetch } = useCircleContext()
  const { messages, loading, error } = useRealtimeMessages(channelId)
  const { sendMessage, sending } = useSendMessage(channelId)
  const { joinChannel, leaveChannel, requestJoinChannel } = useChannels()
  const [showMembers, setShowMembers] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const channel = channels.find((c) => c.id === channelId)
  const isMember = myChannelIds.includes(channelId)
  const isOwner = user && circle && circle.owner_id === user.id

  const handleJoin = async () => {
    setActionLoading(true)
    try {
      if (channel?.is_private) {
        await requestJoinChannel(channelId)
      } else {
        await joinChannel(channelId)
      }
      await refetch()
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    setActionLoading(true)
    try {
      await leaveChannel(channelId)
      await refetch()
    } finally {
      setActionLoading(false)
    }
  }

  // Not a member - show join UI
  if (!isMember && channel) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="border-b border-surface-200 dark:border-surface-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">
              {channel.is_private ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : '#'}
            </span>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {channel.name}
            </h3>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl text-neutral-400">
              {channel.is_private ? '🔒' : '#'}
            </span>
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">
            {channel.name}
          </h3>
          {channel.description && (
            <p className="text-sm text-neutral-500 mb-4 max-w-xs">{channel.description}</p>
          )}
          <button
            onClick={handleJoin}
            disabled={actionLoading}
            className="px-6 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {actionLoading ? '処理中...' : channel.is_private ? '参加を申請' : 'チャンネルに参加'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Channel Header */}
      <div className="border-b border-surface-200 dark:border-surface-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">
              {channel?.is_private ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : '#'}
            </span>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {channel?.name || 'チャンネル'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Members button */}
            <button
              onClick={() => setShowMembers(true)}
              className="p-1.5 rounded-lg text-neutral-500 hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors"
              title="メンバー一覧"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            {/* Leave button (not for default channels) */}
            {!channel?.is_default && (
              <button
                onClick={handleLeave}
                disabled={actionLoading}
                className="px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors disabled:opacity-50"
              >
                退出
              </button>
            )}
          </div>
        </div>
        {channel?.description && (
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {channel.description}
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 text-sm text-red-500">
          メッセージの読み込みに失敗しました: {error}
        </div>
      )}

      {/* Messages */}
      {!loading && !error && user && (
        <MessageList messages={messages} currentUserId={user.id} />
      )}

      {/* Input */}
      <MessageInput onSend={sendMessage} disabled={sending} />

      {/* Members Dialog */}
      <ChannelMemberList
        open={showMembers}
        onClose={() => setShowMembers(false)}
        channelId={channelId}
        isOwner={!!isOwner}
      />
    </div>
  )
}
