'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export interface ConversationWithUser {
  id: string
  user_id_1: string
  user_id_2: string
  created_at: string | null
  updated_at: string | null
  partner: {
    id: string
    username: string | null
    avatar_url: string | null
  }
  last_message: {
    content: string
    created_at: string | null
  } | null
}

export function useConversations() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    if (!data || data.length === 0) {
      setConversations([])
      setLoading(false)
      return
    }

    // Collect all partner user IDs
    const partnerIds = data.map((c) =>
      c.user_id_1 === user.id ? c.user_id_2 : c.user_id_1
    )

    // Fetch partner user info
    const { data: usersData } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', partnerIds)

    const usersMap = new Map(
      (usersData || []).map((u) => [u.id, u])
    )

    // Fetch latest message for each conversation
    const conversationIds = data.map((c) => c.id)
    const { data: latestMessages } = await supabase
      .from('dm_messages')
      .select('conversation_id, content, created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })

    // Group by conversation_id, take first (latest) per conversation
    const latestMap = new Map<string, { content: string; created_at: string | null }>()
    for (const msg of latestMessages || []) {
      if (!latestMap.has(msg.conversation_id)) {
        latestMap.set(msg.conversation_id, {
          content: msg.content,
          created_at: msg.created_at,
        })
      }
    }

    const result: ConversationWithUser[] = data.map((c) => {
      const partnerId = c.user_id_1 === user.id ? c.user_id_2 : c.user_id_1
      const partner = usersMap.get(partnerId)
      return {
        ...c,
        partner: {
          id: partnerId,
          username: partner?.username ?? null,
          avatar_url: partner?.avatar_url ?? null,
        },
        last_message: latestMap.get(c.id) ?? null,
      }
    })

    // Sort by latest message time (conversations with recent messages first)
    result.sort((a, b) => {
      const aTime = a.last_message?.created_at ?? a.updated_at ?? ''
      const bTime = b.last_message?.created_at ?? b.updated_at ?? ''
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    setConversations(result)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const createConversation = async (partnerId: string) => {
    if (!user) throw new Error('Not authenticated')

    // Ensure user_id_1 < user_id_2
    const [uid1, uid2] =
      user.id < partnerId ? [user.id, partnerId] : [partnerId, user.id]

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id_1', uid1)
      .eq('user_id_2', uid2)
      .single()

    if (existing) {
      return existing.id
    }

    const { data, error: insertError } = await supabase
      .from('conversations')
      .insert({ user_id_1: uid1, user_id_2: uid2 })
      .select('id')
      .single()

    if (insertError) throw insertError

    await fetchConversations()
    return data.id
  }

  return { conversations, loading, error, createConversation, refetch: fetchConversations }
}
