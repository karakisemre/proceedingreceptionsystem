import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // 1) RLS'e tabi SSR client — cookie'leri request'ten oku, response'a geri yaz
  let res = NextResponse.json({ ok: true }) // response’u setAll içinde yeniden oluşturacağız
  const rls = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
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

  // 2) Admin kontrolü
  const { data: { user } = { user: null } } = await rls.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { data: prof, error: profErr } = await rls
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (profErr || !prof?.is_admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // 3) Girdi
  const { email, password } = await request.json()

  // 4) Kullanıcıyı oluştur + admin yap (service role)
  const admin = supabaseAdmin()
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true
  })
  if (error || !data?.user) {
    return NextResponse.json({ error: error?.message ?? 'createUser failed' }, { status: 400 })
  }

  const { error: upErr } = await admin
    .from('profiles')
    .upsert({ id: data.user.id, is_admin: true })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

  // 5) Sonuç
  return NextResponse.json({ ok: true, userId: data.user.id })
}
