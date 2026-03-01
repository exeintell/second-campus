'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useProfile } from '@/hooks/useProfile'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { useState, useEffect, useCallback } from 'react'

export function Header() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { username, avatarUrl } = useProfile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const toggleNotifications = useCallback(() => {
    setIsNotificationsOpen(prev => !prev)
  }, [])

  const closeNotifications = useCallback(() => {
    setIsNotificationsOpen(false)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  if (loading) return null

  return (
    <header className="sticky top-0 z-50 border-b border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href={user ? '/circles' : '/'} className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-accent-600 dark:text-accent-400">
              SECOCAM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-1">
            {user && (
              <>
                <Link
                  href="/circles"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors"
                >
                  サークル
                </Link>
                <Link
                  href="/dm"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors"
                >
                  メッセージ
                </Link>
              </>
            )}

            {/* Theme Toggle (PC only) */}
            {mounted && (
              <button
                onClick={cycleTheme}
                className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors"
                title={`テーマ: ${theme === 'light' ? 'ライト' : theme === 'dark' ? 'ダーク' : 'システム'}`}
              >
                {theme === 'dark' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : theme === 'light' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.606a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )}

            {user && (
              <div className="relative">
                <NotificationBell onClick={toggleNotifications} />
                {isNotificationsOpen && <NotificationDropdown onClose={closeNotifications} />}
              </div>
            )}

            <div className="w-px h-5 bg-surface-200 dark:bg-surface-800 mx-2" />

            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors">
                  <UserAvatar username={username} avatarUrl={avatarUrl} size="xs" />
                  <span className="text-xs text-neutral-700 dark:text-neutral-300 max-w-[120px] truncate font-medium">
                    {username || user.email}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-surface-100 dark:hover:bg-surface-900 rounded-lg transition-colors"
                >
                  ログイン
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 text-sm font-medium bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors"
                >
                  新規登録
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile: Notification + Menu Button */}
          <div className="sm:hidden flex items-center gap-1">
            {user && (
              <div className="relative">
                <NotificationBell onClick={toggleNotifications} />
                {isNotificationsOpen && <NotificationDropdown onClose={closeNotifications} />}
              </div>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-surface-100 dark:hover:bg-surface-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="sm:hidden pb-4 space-y-1">
            {user ? (
              <>
                <Link
                  href="/circles"
                  className="block px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-surface-100 dark:hover:bg-surface-900 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  サークル
                </Link>
                <Link
                  href="/dm"
                  className="block px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-surface-100 dark:hover:bg-surface-900 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  メッセージ
                </Link>
                <div className="border-t border-surface-200 dark:border-surface-800 mt-2 pt-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 hover:bg-surface-100 dark:hover:bg-surface-900 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserAvatar username={username} avatarUrl={avatarUrl} size="xs" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {username || user.email}
                    </span>
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false) }}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"
                  >
                    ログアウト
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-surface-100 dark:hover:bg-surface-900 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ログイン
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 rounded-lg text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  新規登録
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
