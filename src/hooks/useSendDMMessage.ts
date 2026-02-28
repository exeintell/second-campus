'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export function useSendDMMessage(conversationId: string) {
  const { user } = useAuth()
  const [sending, setSending] = useState(false)

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user || !content.trim() || !conversationId) return

      setSending(true)
      const { error } = await supabase.from('dm_messages').insert({
        conversation_id: conversationId,
        user_id: user.id,
        content: content.trim(),
      })

      setSending(false)
      if (error) throw error

      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
    },
    [user, conversationId]
  )

  return { sendMessage, sending }
}
