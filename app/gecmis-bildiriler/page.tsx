import { supabaseServer } from '@/lib/supabaseServer'

export const metadata = { title: 'Geçmiş Bildiriler | EFOK' }
export const dynamic = 'force-dynamic'

export default async function PastPapersPage() {
  const sb = supabaseServer()
  const { data } = await sb
    .from('past_papers')
    .select('*')
    .order('year', { ascending: false })
    .order('sort_order', { ascending: false })

  // Yıla göre grupla
  const groups = (data ?? []).reduce((acc: Record<number, any[]>, cur) => {
    (acc[cur.year] ||= []).push(cur)
    return acc
  }, {})

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold">Geçmiş Bildiriler</h1>

      {Object.keys(groups).length === 0 ? (
        <div>Henüz kayıt yok.</div>
      ) : (
        Object.entries(groups).map(([year, items]) => (
          <section key={year} className="space-y-3">
            <h2 className="text-lg font-semibold">{year}</h2>
            <div className="space-y-2">
              {items.map((r: any) => (
                <article key={r.id} className="rounded border p-3">
                  <div className="font-medium">{r.title}</div>
                  {r.authors && <div className="text-sm text-black/70">{r.authors}</div>}
                  <div className="mt-2 flex gap-3">
                    {r.file_path && (
                      <a className="text-blue-600 underline" target="_blank"
                         href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_PAST_BUCKET}/${r.file_path}`}>
                        İndir (Dosya)
                      </a>
                    )}
                    {r.external_url && (
                      <a className="text-blue-600 underline" target="_blank" href={r.external_url}>
                        Dış Link
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  )
}
