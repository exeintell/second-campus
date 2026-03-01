'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { useSendMessage } from '@/hooks/useSendMessage'
import { useCircleContext } from '@/components/circles/CircleProvider'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { useRouteParam } from '@/hooks/useRouteParam'

export default function ChannelPageClient() {
  const channelId = useRouteParam('channelId', 'channels')
  const { user } = useAuth()
  const { channels } = useCircleContext()
  const { messages, loading, error } = useRealtimeMessages(channelId)
  const { sendMessage, sending } = useSendMessage(channelId)

  const channel = channels.find((c) => c.id === channelId)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Channel Header */}
      <div className="border-b border-surface-200 dark:border-surface-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">#</span>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            {channel?.name || 'チャンネル'}
          </h3>
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
    </div>
  )
}
