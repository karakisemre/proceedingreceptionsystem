import { supabaseServer } from '@/lib/supabaseServer'

export default async function AdminPage() {
  const sb = supabaseServer()
  const { data, error } = await sb.from('procedingreceptions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return <div>DB error: {error.message}</div>

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">Başvurular</h1>
      <a className="underline" href="/admin/export">CSV indir</a>
      <table className="mt-4 w-full text-sm">
        <thead><tr><th>Ad</th><th>Başlık</th><th>Tarih</th><th>Dosya</th></tr></thead>
        <tbody>
        {data?.map(r => (
          <tr key={r.id}>
            <td>{r.full_name}</td>
            <td>{r.title}</td>
            <td>{new Date(r.created_at).toLocaleString()}</td>
            <td><a className="text-blue-600 underline" href={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${r.file_path}`} target="_blank">İndir</a></td>
          </tr>
        ))}
        </tbody>
      </table>
    </main>
  )
}
