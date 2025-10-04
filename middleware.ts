// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function parseBasicAuth(header: string | null) {
  if (!header) return null
  const [scheme, encoded] = header.split(' ')
  if (scheme !== 'Basic' || !encoded) return null
  try {
    const decoded = atob(encoded) // Edge global
    const i = decoded.indexOf(':')
    if (i === -1) return null
    return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) }
  } catch { return null }
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  // --- 1) Supabase session'ı tazele (cookies: getAll/setAll)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          response = NextResponse.next({ request })
          ;(cookiesToSet as any[]).forEach((c: any) => {
            if (c.options) response.cookies.set(c.name, c.value, c.options as any)
            else response.cookies.set(c.name, c.value)
          })
        },
      },
    }
  )
  await supabase.auth.getUser()

  // --- 2) Basic Auth (opsiyonel, env ile aç/kapat)
  const ENABLE_BASIC = process.env.NEXT_PUBLIC_ENABLE_BASIC_AUTH === '1'
  const HAVE_CREDS = !!(process.env.BASIC_AUTH_USER && process.env.BASIC_AUTH_PASS)

  const { pathname } = request.nextUrl
  if (
    ENABLE_BASIC &&
    HAVE_CREDS &&
    pathname.startsWith('/admin')
  ) {
    // Sadece üst düzey HTML navigasyonlarında iste
    const mode   = request.headers.get('sec-fetch-mode') // "navigate"
    const dest   = request.headers.get('sec-fetch-dest') // "document"/"iframe"
    const accept = request.headers.get('accept') || ''
    const isHtml = accept.includes('text/html')
    const isDocNav = mode === 'navigate' || dest === 'document' || dest === 'iframe'

    if (isHtml && isDocNav) {
      const creds = parseBasicAuth(request.headers.get('authorization'))
      const ok =
        creds &&
        creds.user === process.env.BASIC_AUTH_USER &&
        creds.pass === process.env.BASIC_AUTH_PASS

      if (!ok) {
        const unauthorized = new NextResponse('Auth required', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="admin", charset="UTF-8"',
            'Cache-Control': 'no-store',
          },
        })
        // Supabase'in settiği cookie'leri 401'e taşı
        response.cookies.getAll().forEach(({ name, value, ...rest }) => {
          unauthorized.cookies.set(name, value, rest as any)
        })
        return unauthorized
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
