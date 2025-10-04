import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { access_token, refresh_token } = await req.json()

  let res = NextResponse.json({ ok: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll(cookiesToSet) {
          res = NextResponse.json({ ok: true })
          ;(cookiesToSet as any[]).forEach((c: any) => {
            if (c.options) res.cookies.set(c.name, c.value, c.options as any)
            else res.cookies.set(c.name, c.value)
          })
        },
      },
    }
  )

  await supabase.auth.setSession({ access_token, refresh_token })
  return res
}
