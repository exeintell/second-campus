'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ui/ProtectedRoute'
import { CircleProvider } from '@/components/circles/CircleProvider'
import { CircleSidebar } from '@/components/circles/CircleSidebar'

export default function CircleLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const circleId = params.circleId as string
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ProtectedRoute>
      <CircleProvider circleId={circleId}>
        <main className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
          {/* Sidebar - Desktop always visible, Mobile toggle */}
          <aside
            className={`${
              sidebarOpen ? 'flex' : 'hidden'
            } sm:flex w-full sm:w-64 lg:w-72 border-r border-surface-200 dark:border-surface-800 flex-col bg-surface-50 dark:bg-surface-950 absolute sm:relative z-40 h-full`}
          >
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="sm:hidden absolute top-3 right-3 p-1 rounded text-neutral-500 hover:bg-surface-200 dark:hover:bg-surface-800"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <CircleSidebar circleId={circleId} />
          </aside>

          {/* Mobile sidebar backdrop */}
          {sidebarOpen && (
            <div
              className="sm:hidden fixed inset-0 z-30 bg-black/30"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Mobile header with menu button */}
            <div className="sm:hidden flex items-center gap-2 p-2 border-b border-surface-200 dark:border-surface-800">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded text-neutral-500 hover:bg-surface-100 dark:hover:bg-surface-900"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
            {children}
          </div>
        </main>
      </CircleProvider>
    </ProtectedRoute>
  )
}
