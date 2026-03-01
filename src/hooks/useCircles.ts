'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type { Database } from '@/types/database.types'

type Circle = Database['public']['Tables']['circles']['Row']

export type CircleWithCounts = Circle & {
  member_count: number
  channel_count: number
}

export function useCircles() {
  const { user } = useAuth()
  const [circles, setCircles] = useState<CircleWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCircles = useCallback(async () => {
    if (!user) {
      setCircles([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Explicitly filter by membership (broad SELECT policy exists for search)
    const { data: memberData } = await supabase
      .from('circle_members')
      .select('circle_id')
      .eq('user_id', user.id)

    const circleIds = memberData?.map((m) => m.circle_id) || []
    if (circleIds.length === 0) {
      setCircles([])
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('circles')
      .select('*, circle_members(count), channels(count)')
      .in('id', circleIds)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    const circlesData: CircleWithCounts[] = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      owner_id: c.owner_id,
      invite_code: c.invite_code,
      created_at: c.created_at,
      updated_at: c.updated_at,
      member_count: c.circle_members?.[0]?.count ?? 0,
      channel_count: c.channels?.[0]?.count ?? 0,
    }))

    setCircles(circlesData)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchCircles()
  }, [fetchCircles])

  const createCircle = async (name: string, description: string) => {
    if (!user) throw new Error('Not authenticated')

    // 1. Create the circle
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .insert({ name, description, owner_id: user.id })
      .select()
      .single()

    if (circleError) throw circleError

    // 2. Add creator as owner member
    const { error: memberError } = await supabase
      .from('circle_members')
      .insert({ circle_id: circle.id, user_id: user.id, role: 'owner' })

    if (memberError) throw memberError

    // 3. Create default channel (trigger auto-adds creator to channel_members)
    const { error: channelError } = await supabase
      .from('channels')
      .insert({ circle_id: circle.id, name: '一般', description: 'デフォルトチャンネル', is_default: true })

    if (channelError) throw channelError

    // Refresh circle list
    await fetchCircles()

    return circle
  }

  return { circles, loading, error, createCircle, refetch: fetchCircles }
}
