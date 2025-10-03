export const metadata = { title: 'Çalıştay & Atölyeler | EFOK 2026' }

import Image from 'next/image'
import { supabaseServer } from '@/lib/supabaseServer'

type Row = {
  id: string
  title: string
  facilitator: string
  slot?: string | null
  location?: string | null
  capacity?: number | null
  description?: string | null
  img_path?: string | null
  img_ratio?: string | null   // 'poster' | '9/16' | '21/9' | 'wide' | ...
  img_pos?: string | null     // 'center top' | '50% 30%' ...
}

export default async function CalistayPage() {
  const sb = supabaseServer()
  const assetBucket = process.env.SUPABASE_ASSET_BUCKET!

  const { data, error } = await sb
    .from('workshops')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: false })
    .order('created_at', { ascending: false })
    .returns<Row[]>()

  if (error) throw new Error(error.message)

  const rows = (data ?? []).map(w => {
    const { data: pub } = w.img_path
      ? sb.storage.from(assetBucket).getPublicUrl(w.img_path)
      : { data: { publicUrl: '' } as any }

    return {
      ...w,
      img: pub?.publicUrl || '',
      ratio: (w.img_ratio || '').toLowerCase().trim(),
      pos: (w.img_pos || 'center center') as React.CSSProperties['objectPosition'],
    }
  })

  // oran → hangi düzen?
  function detectLayout(ratio?: string): 'side' | 'wide' | 'standard' {
    const r = (ratio || '').toLowerCase()
    if (['poster', 'portrait', 'vertical', '9/16', '3/4', '2/3'].some(k => r.includes(k))) return 'side'
    if (['wide', '21/9', 'panorama', 'banner'].some(k => r.includes(k))) return 'wide'
    return 'standard'
  }

  // her düzen için güvenli responsive yükseklik
  function imageHeight(layout: 'side' | 'wide' | 'standard') {
    switch (layout) {
      case 'side':
        // dikey afişlerde daha uzun
        return { height: 'clamp(520px, 62vw, 1040px)' }
      case 'wide':
        return { height: 'clamp(520px, 28vw, 880px)' }
      default:
        return { height: 'clamp(720px, 36vw, 1200px)' }
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Kongre Çalıştayları</h1>

      {!rows.length ? (
        <div className="text-sm text-black/60">Çalıştaylar yakında duyurulacaktır.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {rows.map(w => {
            const layout = detectLayout(w.ratio)

            // ——— DİKEY/POSTER: görsel solda, içerik sağda
            if (layout === 'side') {
              return (
                <article
                  key={w.id}
                  className="rounded-2xl border overflow-hidden bg-white shadow-sm hover:shadow transition-shadow"
                >
                  <div className="grid gap-0 lg:grid-cols-12">
                    <div className="relative lg:col-span-7" style={imageHeight('side')}>
                      {w.img && (
                        <Image
                          src={w.img}
                          alt={w.title}
                          fill
                          sizes="(min-width:1024px) 50vw, 100vw"
                          className="object-cover"
                          style={{ objectPosition: w.pos }}
                        />
                      )}
                    </div>

                    <div className="lg:col-span-5 p-5 space-y-1">
                      <h3 className="text-lg font-semibold leading-snug">{w.title}</h3>
                      <p className="text-sm text-black/70"><b>Eğitmen:</b> {w.facilitator}</p>
                      {w.slot && <p className="text-sm text-black/70"><b>Zaman:</b> {w.slot}</p>}
                      {w.location && <p className="text-sm text-black/70"><b>Yer:</b> {w.location}</p>}
                      {typeof w.capacity === 'number' && (
                        <p className="text-sm text-black/70"><b>Kapasite:</b> {w.capacity}</p>
                      )}
                      {w.description && <p className="text-sm pt-2">{w.description}</p>}
                    </div>
                  </div>
                </article>
              )
            }

            // ——— WIDE/BANNER: görsel üstte ince-uzun
            if (layout === 'wide') {
              return (
                <article
                  key={w.id}
                  className="rounded-2xl border overflow-hidden bg-white shadow-sm hover:shadow transition-shadow"
                >
                  {w.img && (
                    <div className="relative" style={imageHeight('wide')}>
                      <Image
                        src={w.img}
                        alt={w.title}
                        fill
                        sizes="(min-width:1024px) 50vw, 100vw"
                        className="object-cover"
                        style={{ objectPosition: w.pos }}
                      />
                    </div>
                  )}

                  <div className="p-5 space-y-1">
                    <h3 className="text-lg font-semibold leading-snug">{w.title}</h3>
                    <p className="text-sm text-black/70"><b>Eğitmen:</b> {w.facilitator}</p>
                    {w.slot && <p className="text-sm text-black/70"><b>Zaman:</b> {w.slot}</p>}
                    {w.location && <p className="text-sm text-black/70"><b>Yer:</b> {w.location}</p>}
                    {typeof w.capacity === 'number' && (
                      <p className="text-sm text-black/70"><b>Kapasite:</b> {w.capacity}</p>
                    )}
                    {w.description && <p className="text-sm pt-2">{w.description}</p>}
                  </div>
                </article>
              )
            }

            // ——— STANDART: 16/9 ya da bilinmeyen
            return (
              <article
                key={w.id}
                className="rounded-2xl border overflow-hidden bg-white shadow-sm hover:shadow transition-shadow"
              >
                {w.img && (
                  <div className="relative" style={imageHeight('standard')}>
                    <Image
                      src={w.img}
                      alt={w.title}
                      fill
                      sizes="(min-width:1024px) 50vw, 100vw"
                      className="object-cover"
                      style={{ objectPosition: w.pos }}
                    />
                  </div>
                )}

                <div className="p-5 space-y-1">
                  <h3 className="text-lg font-semibold leading-snug">{w.title}</h3>
                  <p className="text-sm text-black/70"><b>Eğitmen:</b> {w.facilitator}</p>
                  {w.slot && <p className="text-sm text-black/70"><b>Zaman:</b> {w.slot}</p>}
                  {w.location && <p className="text-sm text-black/70"><b>Yer:</b> {w.location}</p>}
                  {typeof w.capacity === 'number' && (
                    <p className="text-sm text-black/70"><b>Kapasite:</b> {w.capacity}</p>
                  )}
                  {w.description && <p className="text-sm pt-2">{w.description}</p>}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
