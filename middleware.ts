import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers';
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
    // First, check if the request is from our UI
    const referer = request.headers.get('referer');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    
    // Extract hostname from NEXT_PUBLIC_SITE_URL
    let allowedHost;
    try {
      allowedHost = new URL(siteUrl).hostname;
    } catch {
      allowedHost = siteUrl;
    }

    // Extract hostname from referer
    let refererHost;
    try {
      refererHost = referer ? new URL(referer).hostname : null;
    } catch {
      refererHost = null;
    }

    // If not from our UI, reject immediately
    if (!referer || !refererHost || !refererHost.includes(allowedHost)) {
      console.log(`Invalid referer: ${referer}, allowed host: ${allowedHost}`);
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      );
    }

    // If from our UI but no valid token, generate one
    const hasValidToken = await validateClientToken(request)
    if (!hasValidToken) {
      const response = NextResponse.next()
      await generateClientToken(response)
      return response
    }

    // If from our UI and has valid token, proceed
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