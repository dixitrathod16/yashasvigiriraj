import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateClientToken, generateClientToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  // For API routes, validate the token
  if (request.nextUrl.pathname.startsWith('/api')) {
    const isValidToken = await validateClientToken(request)
    
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // For non-API routes, ensure client has a valid token
  const hasValidToken = await validateClientToken(request)
  if (!hasValidToken) {
    const response = NextResponse.next()
    // Generate and set token in cookie
    await generateClientToken(response)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 