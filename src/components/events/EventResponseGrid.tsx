'use client'

import type { Database } from '@/types/database.types'
import type { ResponseWithUser } from '@/hooks/useEventDetail'

type EventSlot = Database['public']['Tables']['event_slots']['Row']

type ResponseValue = 'available' | 'unavailable' | 'tentative' | null

interface EventResponseGridProps {
  slots: EventSlot[]
  responses: ResponseWithUser[]
  currentUserId: string | undefined
  onResponseChange: (slotId: string, response: ResponseValue) => void
}

const RESPONSE_CYCLE: ResponseValue[] = ['available', 'tentative', 'unavailable', null]

const RESPONSE_DISPLAY: Record<string, { label: string; className: string }> = {
  available: { label: '○', className: 'text-accent-500 font-bold' },
  tentative: { label: '△', className: 'text-yellow-500 font-bold' },
  unavailable: { label: '×', className: 'text-red-400 font-bold' },
}

function formatSlotTime(slot: EventSlot) {
  const start = new Date(slot.start_time)
  const month = start.getMonth() + 1
  const day = start.getDate()
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][start.getDay()]
  const hours = start.getHours().toString().padStart(2, '0')
  const minutes = start.getMinutes().toString().padStart(2, '0')

  let label = `${month}/${day}(${weekday}) ${hours}:${minutes}`
  if (slot.end_time) {
    const end = new Date(slot.end_time)
    const endH = end.getHours().toString().padStart(2, '0')
    const endM = end.getMinutes().toString().padStart(2, '0')
    label += `〜${endH}:${endM}`
  } else {
    label += '〜'
  }
  return label
}

export function EventResponseGrid({
  slots,
  responses,
  currentUserId,
  onResponseChange,
}: EventResponseGridProps) {
  // Build user list: current user first, then others
  const userMap = new Map<string, { username: string; avatar_url: string | null }>()
  for (const r of responses) {
    if (!userMap.has(r.user_id)) {
      userMap.set(r.user_id, {
        username: r.users?.username || '匿名',
        avatar_url: r.users?.avatar_url || null,
      })
    }
  }

  // If current user hasn't responded yet, add them
  if (currentUserId && !userMap.has(currentUserId)) {
    userMap.set(currentUserId, { username: 'あなた', avatar_url: null })
  }

  const userIds = Array.from(userMap.keys()).sort((a, b) => {
    if (a === currentUserId) return -1
    if (b === currentUserId) return 1
    return 0
  })

  // Build response lookup: userId -> slotId -> response
  const responseMap = new Map<string, Map<string, string>>()
  for (const r of responses) {
    if (!responseMap.has(r.user_id)) responseMap.set(r.user_id, new Map())
    if (r.response) responseMap.get(r.user_id)!.set(r.slot_id, r.response)
  }

  // Calculate totals per slot
  const totals = slots.map((slot) => {
    let available = 0
    let tentative = 0
    let unavailable = 0
    for (const userId of userIds) {
      const resp = responseMap.get(userId)?.get(slot.id)
      if (resp === 'available') available++
      else if (resp === 'tentative') tentative++
      else if (resp === 'unavailable') unavailable++
    }
    return { available, tentative, unavailable }
  })

  const handleCellClick = (userId: string, slotId: string) => {
    if (userId !== currentUserId) return
    const current = responseMap.get(userId)?.get(slotId) as ResponseValue | undefined
    const currentIndex = RESPONSE_CYCLE.indexOf(current ?? null)
    const next = RESPONSE_CYCLE[(currentIndex + 1) % RESPONSE_CYCLE.length]
    onResponseChange(slotId, next)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white dark:bg-surface-900 px-3 py-2 text-left text-xs font-semibold text-neutral-500 border-b border-surface-200 dark:border-surface-800 min-w-[100px]">
              メンバー
            </th>
            {slots.map((slot) => (
              <th
                key={slot.id}
                className="px-3 py-2 text-center text-xs font-semibold text-neutral-500 border-b border-surface-200 dark:border-surface-800 whitespace-nowrap min-w-[120px]"
              >
                {formatSlotTime(slot)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {userIds.map((userId) => {
            const isMe = userId === currentUserId
            const user = userMap.get(userId)!
            return (
              <tr
                key={userId}
                className={
                  isMe
                    ? 'bg-accent-50/50 dark:bg-accent-950/30'
                    : ''
                }
              >
                <td className="sticky left-0 z-10 bg-inherit px-3 py-2 text-neutral-900 dark:text-neutral-100 border-b border-surface-200 dark:border-surface-800 font-medium">
                  {isMe ? (
                    <span className="text-accent-600 dark:text-accent-400">
                      {user.username === 'あなた' ? 'あなた' : user.username}
                    </span>
                  ) : (
                    user.username
                  )}
                </td>
                {slots.map((slot) => {
                  const resp = responseMap.get(userId)?.get(slot.id)
                  const display = resp
                    ? RESPONSE_DISPLAY[resp]
                    : null
                  return (
                    <td
                      key={slot.id}
                      onClick={() => handleCellClick(userId, slot.id)}
                      className={`px-3 py-2 text-center border-b border-surface-200 dark:border-surface-800 ${
                        isMe
                          ? 'cursor-pointer hover:bg-accent-100/50 dark:hover:bg-accent-900/30'
                          : ''
                      }`}
                    >
                      {display ? (
                        <span className={display.className}>{display.label}</span>
                      ) : (
                        <span className="text-neutral-300 dark:text-neutral-700">
                          {isMe ? '—' : '—'}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}

          {/* Totals Row */}
          <tr className="bg-surface-50 dark:bg-surface-950">
            <td className="sticky left-0 z-10 bg-inherit px-3 py-2 text-xs font-semibold text-neutral-500 border-b border-surface-200 dark:border-surface-800">
              合計
            </td>
            {totals.map((total, i) => (
              <td
                key={slots[i].id}
                className="px-3 py-2 text-center text-xs border-b border-surface-200 dark:border-surface-800"
              >
                <span className="space-x-1">
                  {total.available > 0 && (
                    <span className="text-accent-500 font-bold">
                      ○{total.available}
                    </span>
                  )}
                  {total.tentative > 0 && (
                    <span className="text-yellow-500 font-bold">
                      △{total.tentative}
                    </span>
                  )}
                  {total.unavailable > 0 && (
                    <span className="text-red-400 font-bold">
                      ×{total.unavailable}
                    </span>
                  )}
                  {total.available === 0 &&
                    total.tentative === 0 &&
                    total.unavailable === 0 && (
                      <span className="text-neutral-400">—</span>
                    )}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
