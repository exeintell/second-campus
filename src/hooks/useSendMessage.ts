'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export function useSendMessage(channelId: string) {
  const { user } = useAuth()
  const [sending, setSending] = useState(false)

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user || !content.trim()) return

      setSending(true)
      const { error } = await supabase.from('messages').insert({
        channel_id: channelId,
        user_id: user.id,
        content: content.trim(),
      })

      setSending(false)
      if (error) throw error
    },
    [user, channelId]
  )

  return { sendMessage, sending }
}
