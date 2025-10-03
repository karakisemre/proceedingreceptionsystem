import Image from 'next/image'
import { supabaseServer } from '@/lib/supabaseServer'

export const metadata = { title: 'Davetli Konuşmacılar | EFOK 2026' }

// Tablo şeman: (örnek)
// id | name | title | org | talk_title | talk_slot | img_path | bio | sort_order | is_active
export default async function KonusmacilarPage() {
  const sb = supabaseServer()
  const assetBucket = process.env.SUPABASE_ASSET_BUCKET! // ör: "assets"

  // Konuşmacıları çek
  const { data, error } = await sb
    .from('speakers')
    .select('name, title, org, talk_title, talk_slot, img_path, bio')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    // Prod’da kullanıcıya nazik bir mesaj göstermek istersen burada koşullandırabilirsin
    throw new Error(error.message)
  }

  // Public URL üret (bucket public ise getPublicUrl çalışır)
  const speakers = (data ?? []).map(s => {
    let img: string | undefined
    if (s.img_path) {
      const { data: pub } = sb.storage.from(assetBucket).getPublicUrl(s.img_path)
      img = pub.publicUrl
    }
    return {
      name: s.name,
      title: s.title ?? undefined,
      org: s.org ?? undefined,
      talkTitle: s.talk_title ?? undefined,
      talkSlot: s.talk_slot ?? undefined,
      img,
      bio: s.bio ?? undefined,
    }
  })

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold">Davetli Konuşmacılar</h1>

      {!speakers.length ? (
        <div className="text-sm text-black/60">Konuşmacılar yakında duyurulacaktır.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map((s, i) => (
            <article key={`${s.name}-${i}`} className="rounded-2xl border overflow-hidden hover:shadow transition">
              <div className="relative aspect-[4/3] bg-gray-100">
                {s.img ? (
                  <Image src={s.img} alt={s.name} fill className="object-cover" />
                ) : null}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-semibold">{s.name}</h3>
                {(s.title || s.org) && (
                  <p className="text-sm text-black/70">{[s.title, s.org].filter(Boolean).join(' • ')}</p>
                )}
                {s.talkTitle && <p className="text-sm"><b>Konuşma:</b> {s.talkTitle}</p>}
                {s.talkSlot && <p className="text-xs text-black/60">{s.talkSlot}</p>}
                {s.bio && <p className="text-sm text-black/80">{s.bio}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
