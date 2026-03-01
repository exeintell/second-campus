'use client'

import { useState } from 'react'
import { useEventDetail } from '@/hooks/useEventDetail'
import { useAuth } from '@/hooks/useAuth'
import { EventResponseGrid } from './EventResponseGrid'

interface EventDetailDialogProps {
  open: boolean
  eventId: string | null
  onClose: () => void
  onDelete?: (eventId: string) => Promise<unknown>
}

export function EventDetailDialog({
  open,
  eventId,
  onClose,
  onDelete,
}: EventDetailDialogProps) {
  const { event, slots, responses, loading, upsertResponse } =
    useEventDetail(open ? eventId : null)
  const { user } = useAuth()
  const [deleting, setDeleting] = useState(false)

  if (!open) return null

  const isCreator = user && event && event.created_by === user.id

  const handleDelete = async () => {
    if (!eventId || !onDelete) return
    setDeleting(true)
    try {
      await onDelete(eventId)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  const handleResponseChange = (
    slotId: string,
    response: 'available' | 'unavailable' | 'tentative' | null
  ) => {
    upsertResponse(slotId, response)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-800 p-6 max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : event ? (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {event.title}
                </h2>
                {event.description && (
                  <p className="text-sm text-neutral-500 mt-1">
                    {event.description}
                  </p>
                )}
                <p className="text-xs text-neutral-400 mt-1">
                  作成者: {event.users?.username || '匿名'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-3">
              クリックで回答: ○(参加可能) → △(未定) → ×(参加不可) → 未回答
            </p>

            <EventResponseGrid
              slots={slots}
              responses={responses}
              currentUserId={user?.id}
              onResponseChange={handleResponseChange}
            />

            {isCreator && onDelete && (
              <div className="mt-6 pt-4 border-t border-surface-200 dark:border-surface-800">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {deleting ? '削除中...' : 'イベントを削除'}
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-neutral-500 py-8">
            イベントが見つかりません
          </p>
        )}
      </div>
    </div>
  )
}
