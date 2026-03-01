'use client'

import { useState } from 'react'
import { useJoinRequests } from '@/hooks/useJoinRequests'

interface JoinRequestListProps {
  circleId: string
}

export function JoinRequestList({ circleId }: JoinRequestListProps) {
  const { requests, loading, approveRequest, rejectRequest } =
    useJoinRequests(circleId)
  const [processing, setProcessing] = useState<string | null>(null)

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId)
    try {
      await approveRequest(requestId)
    } catch {
      // ignore
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (requestId: string) => {
    setProcessing(requestId)
    try {
      await rejectRequest(requestId)
    } catch {
      // ignore
    } finally {
      setProcessing(null)
    }
  }

  if (loading) return null
  if (requests.length === 0) return null

  return (
    <div className="p-4 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
        参加申請{' '}
        <span className="text-accent-600 dark:text-accent-400">
          {requests.length}
        </span>
      </h3>
      <div className="space-y-2">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-surface-900"
          >
            <div className="w-8 h-8 bg-accent-100 dark:bg-accent-900 rounded-full flex items-center justify-center shrink-0">
              <span className="text-accent-600 dark:text-accent-400 font-semibold text-xs">
                {(req.users?.username || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {req.users?.username || '名前未設定'}
              </p>
              <p className="text-[10px] text-neutral-400">
                {new Date(req.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => handleApprove(req.id)}
                disabled={processing === req.id}
                className="px-2.5 py-1 text-xs font-semibold bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white rounded-md transition-colors"
              >
                承認
              </button>
              <button
                onClick={() => handleReject(req.id)}
                disabled={processing === req.id}
                className="px-2.5 py-1 text-xs font-medium text-neutral-500 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors"
              >
                却下
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
