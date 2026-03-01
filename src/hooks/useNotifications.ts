'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type { NotificationRow, NotificationWithActor } from '@/types/notification'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface NotificationContextType {
  notifications: NotificationWithActor[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider')
  }
  return context
}

export function useNotificationsState(): NotificationContextType {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    const { data, error } = await supabase.from('notifications')
      .select('*, actor:users!notifications_actor_id_fkey(username, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      setNotifications(data as NotificationWithActor[])
    }
    setLoading(false)
  }, [user])

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    const { count, error } = await supabase.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (!error && count !== null) {
      setUnreadCount(count)
    }
  }, [user])

  const markAsRead = useCallback(async (id: string) => {
    const { error } = await supabase.from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    const { error } = await supabase.rpc('mark_all_notifications_read')

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [fetchNotifications, fetchUnreadCount])

  // Realtime subscription
  useEffect(() => {
    if (!user) return

    const channel: RealtimeChannel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newNotification = payload.new as NotificationRow

          // Fetch actor info
          let actor: { username: string | null; avatar_url: string | null } | null = null
          if (newNotification.actor_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('username, avatar_url')
              .eq('id', newNotification.actor_id)
              .single()
            actor = userData
          }

          const withActor: NotificationWithActor = { ...newNotification, actor }
          setNotifications(prev => [withActor, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as NotificationRow
          setNotifications(prev =>
            prev.map(n => n.id === updated.id ? { ...n, ...updated } : n)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
