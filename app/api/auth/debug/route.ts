import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  let res = NextResponse.json({ ok: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // gelen request cookie'leri Next otomatik taşıyor, okumaya gerek yok
          return []
        },
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

  const { data } = await supabase.auth.getUser()
  return NextResponse.json({ user: data.user ?? null })
}