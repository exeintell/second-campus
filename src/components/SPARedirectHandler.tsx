'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function SPARedirectHandler() {
  const router = useRouter()

  useEffect(() => {
    // Register Service Worker for GitHub Pages SPA support
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      navigator.serviceWorker.register(
        `${window.location.pathname.startsWith('/second-campus') ? '/second-campus' : ''}/sw.js`
      )
    }

    // Handle redirect from 404.html
    const redirect = sessionStorage.getItem('__spa_redirect')
    if (!redirect) return
    sessionStorage.removeItem('__spa_redirect')

    const basePath = '/second-campus'
    const path = redirect.startsWith(basePath)
      ? redirect.slice(basePath.length) || '/'
      : redirect

    // Wait for SW to be active before navigating
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // SW already active
      router.replace(path)
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        router.replace(path)
      })
    } else {
      router.replace(path)
    }
  }, [router])

  return null
}
