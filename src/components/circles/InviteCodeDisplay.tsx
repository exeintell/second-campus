'use client'

import { useState } from 'react'
import { useInviteCode } from '@/hooks/useInviteCode'

interface InviteCodeDisplayProps {
  circleId: string
}

export function InviteCodeDisplay({ circleId }: InviteCodeDisplayProps) {
  const { inviteCode, loading, regenerateCode } = useInviteCode(circleId)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const handleCopy = async () => {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await regenerateCode()
    } catch {
      // ignore
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) return null

  return (
    <div className="p-4 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        招待コード
      </h3>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg text-center font-mono text-lg tracking-widest text-accent-600 dark:text-accent-400 select-all">
          {inviteCode}
        </code>
        <button
          onClick={handleCopy}
          className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors border border-surface-200 dark:border-surface-800"
          title="コピー"
        >
          {copied ? '完了' : 'コピー'}
        </button>
      </div>
      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="mt-2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
      >
        {regenerating ? '再生成中...' : 'コードを再生成'}
      </button>
    </div>
  )
}
