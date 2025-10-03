import Link from 'next/link'
import HeroSlider from './components/HeroSlider'
import { supabaseServer } from '@/lib/supabaseServer'

export const metadata = {
  title: 'EFOK 2026 | SDÜ Eğitim Fakültesi Öğrenci Kongresi',
  description: 'Öğretmen adaylarının akademik üretime katılımını güçlendiren EFOK kongresi.',
}

export default async function HomePage() {
  const sb = supabaseServer()

  // 1) Slider kayıtları
  const { data: slidesRaw, error: slidesErr } = await sb
    .from('hero_slides')
    .select('title, subtitle, image_path')
    .eq('is_active', true)
    .order('sort_order', { ascending: false })

  if (slidesErr) {
    console.error('slides error:', slidesErr.message)
  }

  const assetBucket = process.env.SUPABASE_ASSET_BUCKET!
  // Supabase helper ile public URL üret (base + path sorunsuz)
  const slides = (slidesRaw ?? [])
    .filter(s => s.image_path)
    .map(s => {
      const { data } = sb.storage.from(assetBucket).getPublicUrl(s.image_path)
      return {
        src: data.publicUrl,                 // 🔑 güvenli public URL
        alt: s.title || 'Slider',
        title: s.title || '',
        subtitle: s.subtitle || '',
        ratio: '16/9',
        pos: 'center center',
      }
    })

  // 2) Son 5 geçmiş bildiri
  const { data: recent } = await sb
    .from('past_papers')
    .select('*')
    .order('year', { ascending: false })
    .order('sort_order', { ascending: false })
    .limit(5)

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-16">
      {/* HERO */}
      <section className="space-y-6">
        {slides.length > 0 ? (
          <HeroSlider slides={slides} fit="contain" />
        ) : (
          <HeroSlider
            slides={[{
              src: '/slider-1.jpg',
              alt: 'EFOK',
              title: 'Eğitim Fakültesi Öğrenci Kongresi',
              subtitle: 'Hoş geldiniz',
              ratio: '16/9',
              pos: 'center center'
            }]}
            fit="contain"
          />
        )}

        <div className="flex justify-center gap-4">
          <Link href="/basvuru" className="px-6 py-3 rounded bg-black text-white shadow hover:opacity-90">
            Bildiri Gönder
          </Link>
          <Link href="/hakkinda" className="px-6 py-3 rounded border hover:bg-gray-50">
            Kongre Hakkında
          </Link>
        </div>
      </section>

      {/* Kısa tanıtım */}
      <section className="grid md:grid-cols-3 gap-6">
        <QuickLink title="Davetli Konuşmacılar" href="/konusmacilar" />
        <QuickLink title="Kurullar" href="/kurullar" />
        <QuickLink title="Çalıştay & Atölyeler" href="/calistay" />
      </section>

      {/* Geçmiş Bildiriler Özet */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Geçmiş Bildiriler (Son 5)</h2>
        {(!recent || recent.length === 0) ? (
          <div className="text-sm text-black/60">Henüz eklenmiş bildiri yok.</div>
        ) : (
          <div className="space-y-2">
            {recent.map((r: any) => (
              <div key={r.id} className="text-sm">
                <b>{r.year}</b> — {r.title}{' '}
                {r.file_path && (
                  <a
                    className="underline text-blue-600"
                    target="_blank"
                    href={
                      sb.storage.from(process.env.SUPABASE_PAST_BUCKET!)
                        .getPublicUrl(r.file_path).data.publicUrl
                    }
                  >
                    (Dosya)
                  </a>
                )}
                {r.external_url && (
                  <a className="underline text-blue-600 ml-2" target="_blank" href={r.external_url}>
                    (Dış Link)
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        <Link href="/gecmis-bildiriler" className="inline-block mt-2 underline">
          Tümünü gör →
        </Link>
      </section>
    </main>
  )
}

function QuickLink({ title, href }: { title: string; href: string }) {
  return (
    <Link href={href} className="rounded-xl border p-5 hover:shadow transition">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm text-black/60 mt-1">Detayları görüntüle →</div>
    </Link>
  )
}
