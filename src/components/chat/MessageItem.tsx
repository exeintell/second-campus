import type { ChatMessage } from '@/types/chat'

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
          <div className="w-7 h-7 bg-accent-100 dark:bg-accent-900 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-accent-600 dark:text-accent-400 font-semibold text-[10px]">
              {(message.users?.username || '?').charAt(0).toUpperCase()}
            </span>
          </div>
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
