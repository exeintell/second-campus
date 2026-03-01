'use client'

import { useRouter } from 'next/navigation'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useNotificationContext } from '@/hooks/useNotifications'
import type { NotificationWithActor } from '@/types/notification'

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return 'たった今'
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
  return `${Math.floor(diff / 86400)}日前`
}

function getNavigationPath(notification: NotificationWithActor): string {
  const { type, circle_id, channel_id } = notification

  switch (type) {
    case 'channel_message':
      return circle_id && channel_id ? `/circles/${circle_id}/channels/${channel_id}` : '/circles'
    case 'dm_message':
      return '/dm'
    case 'circle_join_request':
    case 'join_request_approved':
    case 'join_request_rejected':
    case 'new_event':
      return circle_id ? `/circles/${circle_id}` : '/circles'
    case 'channel_join_request':
    case 'channel_join_approved':
    case 'channel_join_rejected':
      return circle_id && channel_id ? `/circles/${circle_id}/channels/${channel_id}` : '/circles'
    default:
      return '/circles'
  }
}

interface NotificationItemProps {
  notification: NotificationWithActor
  onClose: () => void
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const router = useRouter()
  const { markAsRead } = useNotificationContext()

  const handleClick = async () => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    onClose()
    router.push(getNavigationPath(notification))
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition-colors ${
        notification.is_read
          ? 'hover:bg-surface-100 dark:hover:bg-surface-900'
          : 'bg-accent-50 dark:bg-accent-950 hover:bg-accent-100 dark:hover:bg-accent-900'
      }`}
    >
      {notification.actor ? (
        <UserAvatar
          username={notification.actor.username}
          avatarUrl={notification.actor.avatar_url}
          size="sm"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-surface-200 dark:bg-surface-800 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-800 dark:text-neutral-200 line-clamp-2">
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          {getRelativeTime(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <span className="w-2 h-2 rounded-full bg-accent-500 shrink-0 mt-1.5" />
      )}
    </button>
  )
}
