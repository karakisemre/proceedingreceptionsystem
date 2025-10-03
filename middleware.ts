import { NextResponse, NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  if (url.pathname.startsWith('/admin')) {
    const auth = req.headers.get('authorization') || ''
    const [scheme, encoded] = auth.split(' ')
    const [user, pass] = encoded ? Buffer.from(encoded, 'base64').toString().split(':') : []
    if (scheme !== 'Basic' ||
        user !== process.env.BASIC_AUTH_USER ||
        pass !== process.env.BASIC_AUTH_PASS) {
      return new NextResponse('Auth required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="admin"' },
      })
    }
  }
  return NextResponse.next()
}

export const config = { matcher: ['/admin', '/admin/:path*'] }
