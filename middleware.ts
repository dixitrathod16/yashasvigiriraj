import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { headers, cookies } from 'next/headers';
import { validateClientToken, generateClientToken, decrypt } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  // Check for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Don't check auth for the login page itself
    if (request.nextUrl.pathname === '/admin/login') {
      // If user is already authenticated, redirect to dashboard
      const adminToken = request.cookies.get('admin-token')?.value;
      if (adminToken) {
        const payload = await decrypt(adminToken);
        if (payload?.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
      }
      return NextResponse.next();
    }

    // For all other admin routes, check authentication
    const adminToken = cookies().get('admin-token')?.value;
    
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    const payload = await decrypt(adminToken);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // For API routes, validate the token
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Check referrer for API routes
    const headersList = headers();
    const referer = headersList.get('referer');
    if (!referer || !referer.includes(process.env.NEXT_PUBLIC_SITE_URL || '')) {
      console.log(`Invalid referer: ${referer}`);
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      );
    }

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
    '/admin/:path*',
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|webp|svg)).*)',
  ],
} 