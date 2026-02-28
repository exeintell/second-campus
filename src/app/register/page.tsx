'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上である必要があります')
      return
    }

    setLoading(true)
    try {
      await signUp(email, password, username)
      router.push('/login?registered=true')
    } catch (err) {
      const message = err instanceof Error ? err.message : '登録に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-black tracking-tight text-accent-600 dark:text-accent-400">
              SECOCAM
            </h1>
          </Link>
          <p className="text-sm text-neutral-500">
            新しいサークル体験を始めましょう
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              ユーザー名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all outline-none"
              placeholder="username"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              パスワード（8文字以上）
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              パスワード（確認）
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? '登録中...' : '登録'}
          </button>
        </form>

        <p className="text-xs text-neutral-500 text-center">
          登録することで、
          <Link href="#" className="text-accent-600 dark:text-accent-400 hover:underline">利用規約</Link>
          と
          <Link href="#" className="text-accent-600 dark:text-accent-400 hover:underline">プライバシーポリシー</Link>
          に同意します
        </p>

        <p className="text-center text-sm text-neutral-500">
          既にアカウントがある?{' '}
          <Link href="/login" className="font-medium text-accent-600 dark:text-accent-400 hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  )
}
