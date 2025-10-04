import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/** Next 15 tip farklılıkları için: cookies() bazen Promise tiplenebiliyor */
async function getCookieStore() {
  const maybe = cookies() as any
  return typeof maybe?.then === 'function' ? await maybe : maybe
}

export const supabaseServerRls = async () => {
  const cookieStore: any = await getCookieStore()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // SSR read için yeterli
        getAll() {
          // cookieStore.getAll() mevcut değilse boş dizi dön
          return typeof cookieStore?.getAll === 'function'
            ? cookieStore.getAll()
            : []
        },
        setAll(cookiesToSet) {
          // Server Component içinde yazmak çoğu zaman yasak — sessizce dene
          try {
            cookiesToSet.forEach((c: any) => {
              cookieStore.set?.(c.name, c.value, c.options as any)
            })
          } catch { /* no-op */ }
        },
      },
    }
  )
}