import Link from 'next/link'

interface CircleCardProps {
  id: string
  name: string
  description: string | null
  memberCount: number
  channelCount: number
}

export function CircleCard({
  id,
  name,
  description,
  memberCount,
  channelCount,
}: CircleCardProps) {
  return (
    <Link
      href={`/circles/${id}`}
      className="block p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 hover:border-accent-500 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <span className="text-accent-600 dark:text-accent-400 font-bold text-sm">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {name}
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
            {description || 'サークルの説明はありません'}
          </p>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-neutral-500">
        <span>
          メンバー{' '}
          <span className="font-semibold text-accent-600 dark:text-accent-400">
            {memberCount}
          </span>
        </span>
        <span>
          チャンネル{' '}
          <span className="font-semibold text-cyan-600 dark:text-cyan-400">
            {channelCount}
          </span>
        </span>
      </div>
    </Link>
  )
}
