import type { ChatMessage } from '@/types/chat'
import { UserAvatar } from '@/components/ui/UserAvatar'

interface MessageItemProps {
  message: ChatMessage
  isOwn: boolean
}

export function MessageItem({ message, isOwn }: MessageItemProps) {
  const time = new Date(message.created_at ?? '').toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'flex items-end gap-1.5 flex-row-reverse' : 'flex gap-2'}`}>
        {!isOwn && (
          <UserAvatar username={message.users?.username} avatarUrl={message.users?.avatar_url} size="sm" className="mt-0.5" />
        )}
        <div className={`flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <div>
            {!isOwn && (
              <p className="text-[11px] font-medium text-neutral-500 mb-0.5 ml-1">
                {message.users?.username || '名前未設定'}
              </p>
            )}
            <div
              className={`px-3.5 py-2 rounded-2xl ${
                isOwn
                  ? 'bg-accent-500 rounded-tr-sm'
                  : 'bg-surface-100 dark:bg-surface-800 rounded-tl-sm'
              }`}
            >
              <p
                className={`text-sm whitespace-pre-wrap break-words ${
                  isOwn
                    ? 'text-white'
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {message.content}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-neutral-400 shrink-0 pb-0.5">
            {time}
          </span>
        </div>
      </div>
    </div>
  )
}
