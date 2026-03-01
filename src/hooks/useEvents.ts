'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Event = Database['public']['Tables']['events']['Row']

export type EventWithCreator = Event & {
  users: { username: string | null } | null
  _slotCount?: number
  _responseUserCount?: number
}

export function useEvents(circleId: string) {
  const [events, setEvents] = useState<EventWithCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    if (!circleId || circleId === '_') return

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('events')
      .select('*, users(username)')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    // Fetch slot counts and response user counts per event
    const eventIds = (data || []).map((e) => e.id)
    if (eventIds.length > 0) {
      const [slotsResult, responsesResult] = await Promise.all([
        supabase
          .from('event_slots')
          .select('event_id')
          .in('event_id', eventIds),
        supabase
          .from('event_responses')
          .select('event_id, user_id')
          .in('event_id', eventIds),
      ])

      const slotCounts: Record<string, number> = {}
      for (const slot of slotsResult.data || []) {
        slotCounts[slot.event_id] = (slotCounts[slot.event_id] || 0) + 1
      }

      const responseUsers: Record<string, Set<string>> = {}
      for (const resp of responsesResult.data || []) {
        if (!responseUsers[resp.event_id]) responseUsers[resp.event_id] = new Set()
        responseUsers[resp.event_id].add(resp.user_id)
      }

      const enriched = (data as unknown as EventWithCreator[]).map((event) => ({
        ...event,
        _slotCount: slotCounts[event.id] || 0,
        _responseUserCount: responseUsers[event.id]?.size || 0,
      }))
      setEvents(enriched)
    } else {
      setEvents([])
    }

    setLoading(false)
  }, [circleId])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const createEvent = async (
    title: string,
    description: string,
    slots: { start_time: string; end_time: string | null }[]
  ) => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('ログインが必要です')

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        circle_id: circleId,
        title,
        description: description || null,
        created_by: user.user.id,
      })
      .select()
      .single()

    if (eventError) throw new Error(eventError.message)

    if (slots.length > 0) {
      const { error: slotsError } = await supabase.from('event_slots').insert(
        slots.map((slot) => ({
          event_id: event.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
        }))
      )
      if (slotsError) throw new Error(slotsError.message)
    }

    await fetchEvents()
    return event
  }

  const deleteEvent = async (eventId: string) => {
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
    if (deleteError) throw new Error(deleteError.message)
    await fetchEvents()
  }

  return { events, loading, error, createEvent, deleteEvent, refetch: fetchEvents }
}
