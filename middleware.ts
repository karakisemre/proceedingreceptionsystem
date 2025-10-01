// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/admin')) return

  const auth = req.headers.get('authorization') || ''
  const [scheme, encoded] = auth.split(' ')
  if (scheme !== 'Basic' || !encoded) {
    return new NextResponse('Auth required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' }
    })
  }
  const [u, p] = Buffer.from(encoded, 'base64').toString().split(':')
  if (u !== process.env.BASIC_AUTH_USER || p !== process.env.BASIC_AUTH_PASS) {
    return new NextResponse('Forbidden', { status: 403 })
  }
}

export const config = { matcher: ['/admin/:path*'] }
