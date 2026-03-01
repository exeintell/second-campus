'use client'

import { useState } from 'react'
import { useEvents } from '@/hooks/useEvents'
import { CreateEventDialog } from './CreateEventDialog'
import { EventDetailDialog } from './EventDetailDialog'

interface EventListProps {
  circleId: string
}

export function EventList({ circleId }: EventListProps) {
  const { events, loading, createEvent, deleteEvent } = useEvents(circleId)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const handleCreate = async (
    title: string,
    description: string,
    slots: { start_time: string; end_time: string | null }[]
  ) => {
    await createEvent(title, description, slots)
  }

  const handleDelete = async (eventId: string) => {
    await deleteEvent(eventId)
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
          日程調整
        </h2>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1 text-xs text-accent-500 hover:text-accent-600 font-medium transition-colors"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          新規作成
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-neutral-400 py-4">
          まだイベントがありません
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelectedEventId(event.id)}
              className="w-full text-left p-3 rounded-lg border border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-950 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {event.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  {(event._slotCount ?? 0) > 0 && (
                    <span>候補{event._slotCount}件</span>
                  )}
                  {(event._responseUserCount ?? 0) > 0 && (
                    <span>回答{event._responseUserCount}人</span>
                  )}
                </div>
              </div>
              {event.description && (
                <p className="text-xs text-neutral-500 mt-1 truncate">
                  {event.description}
                </p>
              )}
              <p className="text-xs text-neutral-400 mt-1">
                作成: {event.users?.username || '匿名'}
              </p>
            </button>
          ))}
        </div>
      )}

      <CreateEventDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
      <EventDetailDialog
        open={!!selectedEventId}
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
        onDelete={handleDelete}
      />
    </div>
  )
}
