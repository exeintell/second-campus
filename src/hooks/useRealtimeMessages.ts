'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Message = Database['public']['Tables']['messages']['Row']

export type MessageWithUser = Message & {
  users: { username: string | null; avatar_url: string | null } | null
}

export function useRealtimeMessages(channelId: string) {
  const [messages, setMessages] = useState<MessageWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch initial messages with user info
    const fetchMessages = async () => {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*, users(username, avatar_url)')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setMessages((data as unknown as MessageWithUser[]) || [])
      }
      setLoading(false)
    }

    fetchMessages()

    // Subscribe to realtime changes
    const channel: RealtimeChannel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Fetch user info for the new message
          const newMessage = payload.new as Message
          const { data: userData } = await supabase
            .from('users')
            .select('username, avatar_url')
            .eq('id', newMessage.user_id)
            .single()

          const messageWithUser: MessageWithUser = {
            ...newMessage,
            users: userData,
          }
          setMessages((prev) => [...prev, messageWithUser])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== (payload.old as Message).id)
          )
        }
      )
      .subscribe()

    // Cleanup: unsubscribe from channel
    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId])

  return { messages, loading, error }
}
