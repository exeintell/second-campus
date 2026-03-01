'use client'

import { useState, useCallback, useEffect } from 'react'
import { useJoinCircle } from '@/hooks/useJoinCircle'
import { useAuth } from '@/hooks/useAuth'

interface CircleSearchDialogProps {
  open: boolean
  onClose: () => void
}

interface SearchResult {
  id: string
  name: string
  description: string | null
}

export function CircleSearchDialog({
  open,
  onClose,
}: CircleSearchDialogProps) {
  const { user } = useAuth()
  const { searchCircles, sendJoinRequest, getMyRequestStatus, loading } =
    useJoinCircle()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [requestStatuses, setRequestStatuses] = useState<
    Record<string, string | null>
  >({})
  const [memberCircleIds, setMemberCircleIds] = useState<Set<string>>(
    new Set()
  )
  const [error, setError] = useState<string | null>(null)

  // Load user's circles on open
  useEffect(() => {
    if (!open || !user) return

    const loadMemberCircles = async () => {
      const { supabase } = await import('@/lib/supabase/client')
      const { data } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', user.id)

      setMemberCircleIds(new Set(data?.map((m) => m.circle_id) || []))
    }
    loadMemberCircles()
  }, [open, user])

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setSearching(true)
    const data = await searchCircles(query.trim())
    setResults(data)

    // Check request statuses for results
    const statuses: Record<string, string | null> = {}
    await Promise.all(
      data.map(async (circle) => {
        statuses[circle.id] = await getMyRequestStatus(circle.id)
      })
    )
    setRequestStatuses(statuses)
    setSearching(false)
  }, [query, searchCircles, getMyRequestStatus])

  // Debounced search
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(handleSearch, 300)
    return () => clearTimeout(timer)
  }, [query, open, handleSearch])

  const handleRequest = async (circleId: string) => {
    setError(null)
    try {
      await sendJoinRequest(circleId)
      setRequestStatuses((prev) => ({ ...prev, [circleId]: 'pending' }))
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? (err as { message: string }).message
            : '申請に失敗しました'
      setError(message)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-800 p-6 max-h-[80vh] flex flex-col">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          サークルを探す
        </h2>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="サークル名で検索..."
          className="w-full px-3 py-2.5 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition-all outline-none mb-4"
          autoFocus
        />

        {error && (
          <p className="text-sm text-red-500 mb-3">{error}</p>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
          {searching && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!searching && query && results.length === 0 && (
            <p className="text-sm text-neutral-500 text-center py-8">
              サークルが見つかりません
            </p>
          )}

          {!searching && results.length > 0 && (
            <div className="space-y-2">
              {results.map((circle) => {
                const isMember = memberCircleIds.has(circle.id)
                const requestStatus = requestStatuses[circle.id]

                return (
                  <div
                    key={circle.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-800"
                  >
                    <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-accent-600 dark:text-accent-400 font-bold text-sm">
                        {circle.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {circle.name}
                      </p>
                      {circle.description && (
                        <p className="text-xs text-neutral-500 truncate">
                          {circle.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {isMember ? (
                        <span className="text-xs text-neutral-400 px-3 py-1.5">
                          参加済み
                        </span>
                      ) : requestStatus === 'pending' ? (
                        <span className="text-xs text-amber-500 px-3 py-1.5">
                          申請中
                        </span>
                      ) : requestStatus === 'rejected' ? (
                        <span className="text-xs text-red-500 px-3 py-1.5">
                          却下済み
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRequest(circle.id)}
                          disabled={loading}
                          className="text-xs px-3 py-1.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                        >
                          参加申請
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t border-surface-200 dark:border-surface-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
