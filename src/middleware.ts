import { type NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/circles', '/dm', '/events']
const publicRoutes = ['/login', '/register', '/']

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  )
  const isPublicRoute = publicRoutes.includes(path)

  // Get session from cookie or auth header
  // Note: Proper session validation should be implemented with Supabase auth
  const token = req.cookies.get('auth-token')?.value

  // Protected routes: redirect to login if not authenticated
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Public routes: redirect to circles if already authenticated
  if (isPublicRoute && token && !path.startsWith('/circles')) {
    return NextResponse.redirect(new URL('/circles', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
