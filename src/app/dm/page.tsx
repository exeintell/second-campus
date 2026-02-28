'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/ui/ProtectedRoute'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { NewConversationDialog } from '@/components/dm/NewConversationDialog'
import { useAuth } from '@/hooks/useAuth'
import { useConversations } from '@/hooks/useConversations'
import { useRealtimeDMMessages } from '@/hooks/useRealtimeDMMessages'
import { useSendDMMessage } from '@/hooks/useSendDMMessage'

export default function DMPage() {
  const { user } = useAuth()
  const { conversations, loading, createConversation, refetch } = useConversations()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [showNewDialog, setShowNewDialog] = useState(false)

  const { messages, loading: messagesLoading } = useRealtimeDMMessages(selectedConversationId ?? '')
  const { sendMessage, sending } = useSendDMMessage(selectedConversationId ?? '')

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId)

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const oneDay = 24 * 60 * 60 * 1000

    if (diff < oneDay) {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    }
    if (diff < 2 * oneDay) {
      return '昨日'
    }
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
  }

  const handleNewConversation = async (partnerId: string) => {
    const conversationId = await createConversation(partnerId)
    setSelectedConversationId(conversationId)
    setShowNewDialog(false)
  }

  const handleSend = async (content: string) => {
    await sendMessage(content)
    refetch()
  }

  return (
    <ProtectedRoute>
      <main className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Sidebar */}
        <aside className={`${selectedConversationId ? 'hidden sm:flex' : 'flex'} w-full sm:w-72 lg:w-80 border-r border-surface-200 dark:border-surface-800 flex-col bg-surface-50 dark:bg-surface-950`}>
          <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                メッセージ
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {conversations.length} 個の会話
              </p>
            </div>
            <button
              onClick={() => setShowNewDialog(true)}
              className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-900 text-neutral-500 hover:text-accent-500 transition-colors"
              title="新しい会話"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-neutral-500">
                読み込み中...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm text-neutral-500">
                  まだ会話がありません
                </p>
                <button
                  onClick={() => setShowNewDialog(true)}
                  className="mt-3 text-sm text-accent-500 hover:text-accent-600 font-medium"
                >
                  新しい会話を始める
                </button>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full p-3 text-left hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors border-b border-surface-100 dark:border-surface-900 ${
                    selectedConversationId === conv.id
                      ? 'bg-accent-50 dark:bg-accent-950 border-l-2 border-l-accent-500'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-accent-100 dark:bg-accent-900 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-accent-600 dark:text-accent-400 font-semibold text-xs">
                        {(conv.partner.username || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {conv.partner.username || '名前未設定'}
                        </p>
                        {conv.last_message && (
                          <span className="text-[10px] text-neutral-400 ml-2 shrink-0">
                            {formatTime(conv.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      {conv.last_message && (
                        <p className="text-xs text-neutral-500 truncate mt-0.5">
                          {conv.last_message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <div className={`${selectedConversationId ? 'flex' : 'hidden sm:flex'} flex-1 flex-col`}>
          {selectedConversation && user ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-surface-200 dark:border-surface-800 px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversationId(null)}
                  className="sm:hidden p-1 -ml-1 rounded text-neutral-500 hover:bg-surface-100 dark:hover:bg-surface-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-8 h-8 bg-accent-100 dark:bg-accent-900 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-accent-600 dark:text-accent-400 font-semibold text-xs">
                    {(selectedConversation.partner.username || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {selectedConversation.partner.username || '名前未設定'}
                  </h3>
                </div>
              </div>

              {/* Messages */}
              {messagesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-neutral-500">読み込み中...</p>
                </div>
              ) : (
                <MessageList messages={messages} currentUserId={user.id} />
              )}

              {/* Input */}
              <MessageInput onSend={handleSend} disabled={sending} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <div className="text-5xl mb-3">💬</div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                メッセージを選択
              </h3>
              <p className="text-sm text-neutral-500 max-w-xs">
                左から会話を選択するとメッセージが表示されます
              </p>
            </div>
          )}
        </div>
      </main>

      <NewConversationDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onSelect={handleNewConversation}
      />
    </ProtectedRoute>
  )
}
