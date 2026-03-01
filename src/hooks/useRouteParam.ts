'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

/**
 * On GitHub Pages (static export), pre-rendered pages use placeholder params (_).
 * This hook reads the actual param from window.location when useParams() returns _.
 */
export function useRouteParam(paramName: string, segmentName: string): string {
  const params = useParams()
  const fromRouter = params[paramName] as string
  const [value, setValue] = useState(fromRouter)

  useEffect(() => {
    if (fromRouter && fromRouter !== '_') {
      setValue(fromRouter)
      return
    }
    // Parse actual value from URL
    const regex = new RegExp(`/${segmentName}/([^/]+)`)
    const match = window.location.pathname.match(regex)
    if (match && match[1] !== '_') {
      setValue(match[1])
    }
  }, [fromRouter, paramName, segmentName])

  return value
}
