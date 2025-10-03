import { supabaseServer } from '@/lib/supabaseServer'
import SubmissionsTable, { AdminRow } from './submissions-table'

export const dynamic = 'force-dynamic' // admin listesi hep taze olsun

export default async function AdminPage() {
  const sb = supabaseServer()
  const { data, error } = await sb
    .from('procedingreceptions')
    .select('id, full_name, title, created_at, file_path, email, university, file_mime, file_size')
    .order('created_at', { ascending: false })

  if (error) return <main className="p-6">DB error: {error.message}</main>

  // Güvenli public URL üret (bucket public ise). Private ise createSignedUrl tercih edebilirsin.
  const BUCKET = process.env.SUPABASE_BUCKET!
  const rows: AdminRow[] = (data ?? []).map((r) => {
    const pub = sb.storage.from(BUCKET).getPublicUrl(r.file_path)
    // pub.data.publicUrl public bucket'ta direkt çalışır
    const file_url = pub?.data?.publicUrl ?? ''
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

