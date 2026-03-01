export type NotificationType =
  | 'channel_message'
  | 'dm_message'
  | 'circle_join_request'
  | 'channel_join_request'
  | 'join_request_approved'
  | 'join_request_rejected'
  | 'channel_join_approved'
  | 'channel_join_rejected'
  | 'new_event'

export interface NotificationRow {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  circle_id: string | null
  channel_id: string | null
  conversation_id: string | null
  event_id: string | null
  actor_id: string | null
  is_read: boolean
  created_at: string
}

export interface NotificationWithActor extends NotificationRow {
  actor: {
    username: string | null
    avatar_url: string | null
  } | null
}
