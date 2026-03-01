'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface JoinRequestWithUser {
  id: string
  circle_id: string
  user_id: string
  status: string
  created_at: string
  resolved_at: string | null
  users: { username: string | null; avatar_url: string | null } | null
}

export function useJoinRequests(circleId: string) {
  const [requests, setRequests] = useState<JoinRequestWithUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = useCallback(async () => {
    if (!circleId) return

    const { data } = await supabase
      .from('join_requests')
      .select('*, users(username, avatar_url)')
      .eq('circle_id', circleId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    setRequests((data as unknown as JoinRequestWithUser[]) || [])
    setLoading(false)
  }, [circleId])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // Realtime subscription for new requests
  useEffect(() => {
    if (!circleId) return

    const channel = supabase
      .channel(`join_requests:${circleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'join_requests',
          filter: `circle_id=eq.${circleId}`,
        },
        () => {
          fetchRequests()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [circleId, fetchRequests])

  const approveRequest = useCallback(async (requestId: string) => {
    const { error } = await supabase.rpc('approve_join_request', {
      request_id: requestId,
    })
    if (error) throw error
  }, [])

  const rejectRequest = useCallback(async (requestId: string) => {
    const { error } = await supabase
      .from('join_requests')
      .update({ status: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', requestId)

    if (error) throw error
  }, [])

  return { requests, loading, approveRequest, rejectRequest, refetch: fetchRequests }
}
