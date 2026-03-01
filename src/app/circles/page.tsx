'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/ui/ProtectedRoute'
import { useCircles } from '@/hooks/useCircles'
import { CircleCard } from '@/components/circles/CircleCard'
import { CreateCircleDialog } from '@/components/circles/CreateCircleDialog'
import { JoinByCodeDialog } from '@/components/circles/JoinByCodeDialog'
import { CircleSearchDialog } from '@/components/circles/CircleSearchDialog'

export default function CirclesPage() {
  const { circles, loading, error, createCircle, refetch } = useCircles()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinCodeDialog, setShowJoinCodeDialog] = useState(false)
  const [showSearchDialog, setShowSearchDialog] = useState(false)

  return (
    <ProtectedRoute>
      <main className="min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                サークル
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                あなたが参加しているサークル一覧
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowJoinCodeDialog(true)}
                className="px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors border border-surface-200 dark:border-surface-800"
              >
                招待コードで参加
              </button>
              <button
                onClick={() => setShowSearchDialog(true)}
                className="px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors border border-surface-200 dark:border-surface-800"
              >
                サークルを探す
              </button>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                + 新規作成
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && circles.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-accent-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                まだサークルがありません
              </h3>
              <p className="text-sm text-neutral-500 mb-6">
                サークルを作成して、仲間とつながりましょう
              </p>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                最初のサークルを作成
              </button>
            </div>
          )}

          {/* Circles Grid */}
          {!loading && circles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {circles.map((circle) => (
                <CircleCard
                  key={circle.id}
                  id={circle.id}
                  name={circle.name}
                  description={circle.description}
                  memberCount={circle.member_count}
                  channelCount={circle.channel_count}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateCircleDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={createCircle}
      />

      <JoinByCodeDialog
        open={showJoinCodeDialog}
        onClose={() => {
          setShowJoinCodeDialog(false)
          refetch()
        }}
      />

      <CircleSearchDialog
        open={showSearchDialog}
        onClose={() => {
          setShowSearchDialog(false)
          refetch()
        }}
      />
    </ProtectedRoute>
  )
}
