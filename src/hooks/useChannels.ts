'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useChannels() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createChannel = async (circleId: string, name: string, description: string) => {
    setLoading(true)
    setError(null)
    const { error: insertError } = await supabase
      .from('channels')
      .insert({ circle_id: circleId, name, description: description || null })
    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      throw new Error(insertError.message)
    }
    setLoading(false)
  }

  const deleteChannel = async (channelId: string) => {
    setLoading(true)
    setError(null)
    const { error: deleteError } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId)
    if (deleteError) {
      setError(deleteError.message)
      setLoading(false)
      throw new Error(deleteError.message)
    }
    setLoading(false)
  }

  return { createChannel, deleteChannel, loading, error }
}
