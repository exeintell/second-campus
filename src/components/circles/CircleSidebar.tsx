'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCircleContext } from './CircleProvider'

export function CircleSidebar({ circleId }: { circleId: string }) {
  const { circle, channels, loading } = useCircleContext()
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Circle Header */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-800">
        <Link href={`/circles/${circleId}`} className="block">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {loading ? '...' : circle?.name}
          </h2>
          {circle?.description && (
            <p className="text-xs text-neutral-500 mt-0.5 truncate">
              {circle.description}
            </p>
          )}
        </Link>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            チャンネル
          </span>
        </div>
        {channels.map((channel) => {
          const isActive =
            pathname === `/circles/${circleId}/channels/${channel.id}`
          return (
            <Link
              key={channel.id}
              href={`/circles/${circleId}/channels/${channel.id}`}
              className={`flex items-center gap-2 mx-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-accent-50 dark:bg-accent-950 text-accent-700 dark:text-accent-300 font-medium'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-surface-100 dark:hover:bg-surface-900'
              }`}
            >
              <span className="text-neutral-400">#</span>
              <span className="truncate">{channel.name}</span>
            </Link>
          )
        })}
      </div>

      {/* Back Link */}
      <div className="p-3 border-t border-surface-200 dark:border-surface-800">
        <Link
          href="/circles"
          className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          サークル一覧に戻る
        </Link>
      </div>
    </div>
  )
}
