'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import type { Database } from '@/types/database.types'

type Circle = Database['public']['Tables']['circles']['Row']
type Channel = Database['public']['Tables']['channels']['Row']
type CircleMember = Database['public']['Tables']['circle_members']['Row']

export type MemberWithUser = CircleMember & {
  users: { username: string | null; avatar_url: string | null } | null
}

export function useCircleDetail(circleId: string) {
  const { user } = useAuth()
  const [circle, setCircle] = useState<Circle | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [members, setMembers] = useState<MemberWithUser[]>([])
  const [myChannelIds, setMyChannelIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    if (!circleId || circleId === '_') return

    setLoading(true)
    setError(null)

    const [circleResult, channelsResult, membersResult, myChannelsResult] = await Promise.all([
      supabase.from('circles').select('*').eq('id', circleId).single(),
      supabase
        .from('channels')
        .select('*')
        .eq('circle_id', circleId)
        .order('created_at'),
      supabase
        .from('circle_members')
        .select('*, users(username, avatar_url)')
        .eq('circle_id', circleId)
        .order('joined_at'),
      user
        ? supabase
            .from('channel_members')
            .select('channel_id')
            .eq('user_id', user.id)
        : Promise.resolve({ data: null }),
    ])

    if (circleResult.error) {
      setError(circleResult.error.message)
      setLoading(false)
      return
    }

    setCircle(circleResult.data)
    setChannels(channelsResult.data || [])
    setMembers((membersResult.data as unknown as MemberWithUser[]) || [])

    // Filter to only channel IDs in this circle
    const allMyChannelIds = (myChannelsResult.data || []).map((r) => r.channel_id)
    const circleChannelIds = new Set((channelsResult.data || []).map((c) => c.id))
    setMyChannelIds(allMyChannelIds.filter((id) => circleChannelIds.has(id)))

    setLoading(false)
  }, [circleId, user])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  return { circle, channels, members, myChannelIds, loading, error, refetch: fetchDetail }
}
