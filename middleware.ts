import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
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
    const adminToken = request.cookies.get('admin-token')?.value;
    
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    const payload = await decrypt(adminToken);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    return NextResponse.next();
  }

  // For API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    try {
      const isValidToken = await validateClientToken(request);
      
      if (!isValidToken) {
        // For API routes that don't require validation
        if (request.nextUrl.pathname === '/api/register' || request.nextUrl.pathname === '/api/admin/login') {
          return NextResponse.next();
        }
        
        return NextResponse.json(
          { error: 'Unauthorized access' },
          { status: 401 }
        );
      }
      
      return NextResponse.next();
    } catch (error) {
      console.error('API route error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  // For regular routes (non-API, non-admin)
  try {
    const hasValidToken = await validateClientToken(request);
    if (!hasValidToken) {
      const response = NextResponse.next();
      await generateClientToken(response);
      return response;
    }
    return NextResponse.next();
  } catch (error) {
    console.error('Regular route error:', error);
    return NextResponse.next();
  }
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