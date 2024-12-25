import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const SECRET_KEY = process.env.API_SECRET_KEY || 'your-secret-key'
const key = new TextEncoder().encode(SECRET_KEY)

interface TokenPayload {
  client: string;
  [key: string]: unknown;
}

export async function encrypt(payload: TokenPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

export async function decrypt(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key)
    return payload as TokenPayload
  } catch {
    return null
  }
}

// Generate a client token and store in cookie
export async function generateClientToken(response?: NextResponse) {
  const token = await encrypt({ client: 'web-client' })
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 86400 // 24 hours
  }

  if (response) {
    // If response object is provided, set cookie in the response
    response.cookies.set('client-token', token, cookieOptions)
  } else {
    // Otherwise use the cookies() API (for server components)
    cookies().set('client-token', token, cookieOptions)
  }
  
  return token
}

// Validate the client token from request
export async function validateClientToken(request: NextRequest) {
  const token = request.cookies.get('client-token')?.value
  if (!token) return false
  
  const payload = await decrypt(token)
  return payload?.client === 'web-client'
} 