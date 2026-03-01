'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Event = Database['public']['Tables']['events']['Row']
type EventSlot = Database['public']['Tables']['event_slots']['Row']
type EventResponse = Database['public']['Tables']['event_responses']['Row']

export type EventWithCreator = Event & {
  users: { username: string | null } | null
}

export type ResponseWithUser = EventResponse & {
  users: { username: string | null; avatar_url: string | null } | null
}

export function useEventDetail(eventId: string | null) {
  const [event, setEvent] = useState<EventWithCreator | null>(null)
  const [slots, setSlots] = useState<EventSlot[]>([])
  const [responses, setResponses] = useState<ResponseWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    if (!eventId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const [eventResult, slotsResult, responsesResult] = await Promise.all([
      supabase
        .from('events')
        .select('*, users(username)')
        .eq('id', eventId)
        .single(),
      supabase
        .from('event_slots')
        .select('*')
        .eq('event_id', eventId)
        .order('start_time', { ascending: true }),
      supabase
        .from('event_responses')
        .select('*, users(username, avatar_url)')
        .eq('event_id', eventId),
    ])

    if (eventResult.error) {
      setError(eventResult.error.message)
      setLoading(false)
      return
    }

    setEvent(eventResult.data as unknown as EventWithCreator)
    setSlots(slotsResult.data || [])
    setResponses((responsesResult.data as unknown as ResponseWithUser[]) || [])
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  // Realtime subscription for event_responses
  useEffect(() => {
    if (!eventId) return

    const channel: RealtimeChannel = supabase
      .channel(`event_responses:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_responses',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          // Re-fetch responses on any change
          fetchDetail()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, fetchDetail])

  const upsertResponse = async (
    slotId: string,
    response: 'available' | 'unavailable' | 'tentative' | null
  ) => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user || !eventId) return

    if (response === null) {
      // Delete the response
      await supabase
        .from('event_responses')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userData.user.id)
        .eq('slot_id', slotId)
    } else {
      await supabase.from('event_responses').upsert(
        {
          event_id: eventId,
          user_id: userData.user.id,
          slot_id: slotId,
          response,
        },
        { onConflict: 'event_id,user_id,slot_id' }
      )
    }
  }

  return { event, slots, responses, loading, error, upsertResponse, refetch: fetchDetail }
}
