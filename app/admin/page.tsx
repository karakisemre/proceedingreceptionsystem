import { redirect } from 'next/navigation'
import { supabaseServerRls } from '@/lib/supabaseServerRls'
import SubmissionsTable, { AdminRow } from './submissions-table'
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // supabaseServerRls artık Promise döndürüyor => await şart
  const sb = await supabaseServerRls()

  // 1) Auth kontrol
  const { data: auth } = await sb.auth.getUser()
  const user = auth?.user
  if (!user) redirect('/login')

  // 2) Admin mi?
  const { data: profile, error: profErr } = await sb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profErr || !profile?.is_admin) redirect('/')

  // 3) Kayıtları çek (RLS'e tabi)
  const { data, error } = await sb
    .from('procedingreceptions')
    .select('id, full_name, title, created_at, file_path, email, university, file_mime, file_size')
    .order('created_at', { ascending: false })

  if (error) return <main className="p-6">DB error: {error.message}</main>

  // 4) Private bucket için signed URL üret
  const BUCKET = process.env.SUPABASE_BUCKET!

  const rows: AdminRow[] = await Promise.all(
    (data ?? []).map(async (r) => {
      let file_url = ''

      // Private ise: signed URL (1 saat)
      const { data: signed, error: signErr } = await sb
        .storage
        .from(BUCKET)
        .createSignedUrl(r.file_path, 60 * 60, { download: true })

      if (!signErr && signed?.signedUrl) {
        file_url = signed.signedUrl
      } else {
        // Bucket public ise burası çalışır
        const pub = sb.storage.from(BUCKET).getPublicUrl(r.file_path)
        file_url = pub?.data?.publicUrl ?? ''
      }

      return {
        id: r.id,
        full_name: r.full_name,
        title: r.title,
        created_at: r.created_at,
        file_url,
        email: r.email ?? '',
        university: r.university ?? '',
        file_mime: r.file_mime ?? '',
        file_size: r.file_size ?? 0,
      }
    })
  )

  return (
    <main className="p-6 space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-bold">Başvurular</h1>
        <a
          className="inline-flex items-center gap-2 px-3 py-2 rounded bg-black text-white hover:bg-neutral-800"
          href="/api/admin/export"
        >
          CSV indir
        </a>
      </header>

      <SubmissionsTable rows={rows} />
    </main>
  )
}
