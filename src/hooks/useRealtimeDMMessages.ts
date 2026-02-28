'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { ChatMessage } from '@/types/chat'

type DMMessage = Database['public']['Tables']['dm_messages']['Row']

export function useRealtimeDMMessages(conversationId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setLoading(false)
      return
    }

    const fetchMessages = async () => {
      const { data, error: fetchError } = await supabase
        .from('dm_messages')
        .select('*, users(username, avatar_url)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setMessages((data as unknown as ChatMessage[]) || [])
      }
      setLoading(false)
    }

    fetchMessages()

    const channel: RealtimeChannel = supabase
      .channel(`dm_messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dm_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as DMMessage
          const { data: userData } = await supabase
            .from('users')
            .select('username, avatar_url')
            .eq('id', newMessage.user_id)
            .single()

          const chatMessage: ChatMessage = {
            id: newMessage.id,
            user_id: newMessage.user_id,
            content: newMessage.content,
            created_at: newMessage.created_at,
            users: userData,
          }
          setMessages((prev) => [...prev, chatMessage])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'dm_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== (payload.old as DMMessage).id)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  return { messages, loading, error }
}
