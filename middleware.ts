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

  // Check for coordinator routes
  if (request.nextUrl.pathname.startsWith('/coordinator')) {
    // Don't check auth for the login page itself
    if (request.nextUrl.pathname === '/coordinator/login') {
      // If user is already authenticated, redirect to dashboard
      const token = request.cookies.get('coordinator-token')?.value;
      if (token) {
        const payload = await decrypt(token);
        if (payload?.role === 'coordinator') {
          return NextResponse.redirect(new URL('/coordinator/dashboard', request.url));
        }
      }
      return NextResponse.next();
    }

    // For all other coordinator routes, check authentication
    const token = cookies().get('coordinator-token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/coordinator/login', request.url));
    }

    const payload = await decrypt(token);
    if (!payload || payload.role !== 'coordinator') {
      return NextResponse.redirect(new URL('/coordinator/login', request.url));
    }
  }

  // For API routes, validate the token
  if (request.nextUrl.pathname.startsWith('/api')) {
    // First, check if the request is from our UI
    const referer = request.headers.get('referer');
    // const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

    const allowedReferers: string[] = [
      process.env.NEXT_PUBLIC_SITE_URL || '',
      process.env.NEXT_DEVELOPMENT_SITE_URL || '',
    ];


    const allowedHosts: string[] = [];

    // Extract hostname from NEXT_PUBLIC_SITE_URL, NEXT_DEVELOPMENT_SITE_URL
    allowedReferers.forEach(siteUrl => {
      if (!siteUrl) {
        return;
      }
      try {
        allowedHosts.push(new URL(siteUrl).hostname);
      } catch {
        allowedHosts.push(siteUrl);
      }
    });

    // Extract hostname from referer
    let refererHost;
    try {
      refererHost = referer ? new URL(referer).hostname : null;
    } catch {
      refererHost = null;
    }

    let invalidReferer = true;
    // If not from our UI, reject immediately
    for (const allowedHost of allowedHosts) {
      if (referer && refererHost && refererHost.includes(allowedHost)) {
        invalidReferer = false;
        break;
      }
    }

    if (invalidReferer) {
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