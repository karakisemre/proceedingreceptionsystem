import Image from 'next/image'
import { supabaseServer } from '@/lib/supabaseServer'

export const metadata = { title: 'Kurullar | EFOK 2026' }

type Group = { id: number; slug: string; title: string }
type Member = {
  id: string
  group_id: number
  name: string
  role?: string | null
  img_path?: string | null
  bio?: string | null
  sort_order?: number | null
  is_active?: boolean | null
}

export default async function KurullarPage() {
  const sb = supabaseServer()
  const assetBucket = process.env.SUPABASE_ASSET_BUCKET! // ör: "assets"

  // 1) Grupları çek
  const { data: groups, error: gErr } = await sb
    .from('committee_groups')
    .select('id, slug, title')
    .order('id', { ascending: true })

  if (gErr) throw new Error(gErr.message)

  // 2) Üyeleri tek seferde çek ve gruplara dağıt
  const groupIds = (groups ?? []).map(g => g.id)
  let membersByGroup = new Map<number, Member[]>()

  if (groupIds.length) {
    const { data: members, error: mErr } = await sb
      .from('committee_members')
      .select('*')
      .in('group_id', groupIds)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (mErr) throw new Error(mErr.message)

    // 3) Public URL üret (bucket public ise)
    const withUrls: Member[] = (members ?? []).map(m => {
      if (m.img_path) {
        const { data } = sb.storage.from(assetBucket).getPublicUrl(m.img_path)
        return { ...m, img_path: data.publicUrl }
      }
      return m
    })

    // 4) Gruplandır
    withUrls.forEach(m => {
      const arr = membersByGroup.get(m.group_id) || []
      arr.push(m)
      membersByGroup.set(m.group_id, arr)
    })
  }

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-12">
      {(groups ?? []).map(g => (
        <Section
          key={g.id}
          title={g.title}
          // Düzenleme Kurulu 2 sütun, diğerleri 3 sütun gibi bir tercih:
          cols={g.slug === 'duzenleme' ? 2 : 3}
          people={(membersByGroup.get(g.id) ?? []).map(m => ({
            name: m.name,
            role: m.role ?? undefined,
            img: m.img_path ?? undefined,
            bio: m.bio ?? undefined,
          }))}
        />
      ))}

      {!groups?.length && (
        <div className="text-sm text-black/60">Şimdilik tanımlı kurul bulunmuyor.</div>
      )}
    </main>
  )
}

type Person = { name: string; role?: string; img?: string; bio?: string }

function Section({ title, people, cols = 2 }: { title: string; people: Person[]; cols?: number }) {
  const colsClass =
    cols === 4 ? 'lg:grid-cols-4'
    : cols === 3 ? 'lg:grid-cols-3'
    : 'lg:grid-cols-2'

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold">{title}</h2>

      {!people.length ? (
        <div className="text-sm text-black/60">Bu kurula henüz üye eklenmedi.</div>
      ) : (
        <div className={`grid sm:grid-cols-2 ${colsClass} gap-6`}>
          {people.map((p, i) => (
            <article key={`${p.name}-${i}`} className="rounded-2xl border p-4 flex gap-4 items-start">
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gray-100 shrink-0">
                {p.img ? (
                  <Image src={p.img} alt={p.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-sm text-black/50">👤</div>
                )}
              </div>
              <div className="space-y-1">
                <div className="font-semibold">{p.name}</div>
                {p.role && <div className="text-sm text-black/70">{p.role}</div>}
                {p.bio && <p className="text-sm text-black/80">{p.bio}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
