'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export function useChannels() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createChannel = async (circleId: string, name: string, description: string, isPrivate: boolean = false) => {
    if (!user) throw new Error('Not authenticated')
    setLoading(true)
    setError(null)

    const { data: channel, error: insertError } = await supabase
      .from('channels')
      .insert({
        circle_id: circleId,
        name,
        description: description || null,
        is_private: isPrivate,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      throw new Error(insertError.message)
    }

    // Add creator as channel member
    await supabase
      .from('channel_members')
      .insert({ channel_id: channel.id, user_id: user.id })

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

  const joinChannel = async (channelId: string) => {
    if (!user) throw new Error('Not authenticated')
    setLoading(true)
    setError(null)
    const { error: joinError } = await supabase
      .from('channel_members')
      .insert({ channel_id: channelId, user_id: user.id })
    if (joinError) {
      setError(joinError.message)
      setLoading(false)
      throw new Error(joinError.message)
    }
    setLoading(false)
  }

  const leaveChannel = async (channelId: string) => {
    if (!user) throw new Error('Not authenticated')
    setLoading(true)
    setError(null)
    const { error: leaveError } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', user.id)
    if (leaveError) {
      setError(leaveError.message)
      setLoading(false)
      throw new Error(leaveError.message)
    }
    setLoading(false)
  }

  const inviteToChannel = async (channelId: string, userId: string) => {
    setLoading(true)
    setError(null)
    const { error: rpcError } = await supabase.rpc('invite_to_channel', {
      p_channel_id: channelId,
      p_user_id: userId,
    })
    if (rpcError) {
      setError(rpcError.message)
      setLoading(false)
      throw new Error(rpcError.message)
    }
    setLoading(false)
  }

  const requestJoinChannel = async (channelId: string) => {
    if (!user) throw new Error('Not authenticated')
    setLoading(true)
    setError(null)
    const { error: reqError } = await supabase
      .from('channel_join_requests')
      .insert({ channel_id: channelId, user_id: user.id })
    if (reqError) {
      setError(reqError.message)
      setLoading(false)
      throw new Error(reqError.message)
    }
    setLoading(false)
  }

  const approveJoinRequest = async (requestId: string) => {
    setLoading(true)
    setError(null)
    const { error: rpcError } = await supabase.rpc('approve_channel_join_request', {
      p_request_id: requestId,
    })
    if (rpcError) {
      setError(rpcError.message)
      setLoading(false)
      throw new Error(rpcError.message)
    }
    setLoading(false)
  }

  const rejectJoinRequest = async (requestId: string) => {
    setLoading(true)
    setError(null)
    const { error: updateError } = await supabase
      .from('channel_join_requests')
      .update({ status: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', requestId)
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      throw new Error(updateError.message)
    }
    setLoading(false)
  }

  return {
    createChannel,
    deleteChannel,
    joinChannel,
    leaveChannel,
    inviteToChannel,
    requestJoinChannel,
    approveJoinRequest,
    rejectJoinRequest,
    loading,
    error,
  }
}
