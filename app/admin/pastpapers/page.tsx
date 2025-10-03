'use client'
import { useEffect, useRef, useState } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'

type Row = {
  id?: string
  year: number
  title: string
  authors?: string | null
  file_path?: string | null
  file_mime?: string | null
  external_url?: string | null
}

export default function pastpapersAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  // form
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [title, setTitle] = useState('')
  const [authors, setAuthors] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [externalUrl, setExternalUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/admin/pastpapers/list')
        const j = await r.json()
        if (!r.ok) throw new Error(j.error || 'Liste alınamadı')
        setRows(j.rows || [])
      } catch (e:any) {
        setErr(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function uploadFileToStorage(f: File) {
    const up = await fetch('/api/signed-upload-paper', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ filename: f.name, mime: f.type }),
    })
    const j = await up.json()
    if (!up.ok) throw new Error(j.error || 'İmzalı yükleme oluşturulamadı')
    const sb = supabaseClient()
    const { error } = await sb.storage.from(j.bucket).uploadToSignedUrl(j.path, j.token, f)
    if (error) throw error
    return { path: j.path as string, mime: f.type as string }
  }

  async function addRow(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !year) return alert('Yıl ve başlık zorunlu')
    setSaving(true)
    try {
      let uploaded: { path: string, mime: string } | null = null
      if (file) uploaded = await uploadFileToStorage(file)

      const res = await fetch('/api/admin/pastpapers/create', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          year,
          title,
          authors: authors || null,
          file_path: uploaded?.path || null,
          file_mime: uploaded?.mime || null,
          external_url: externalUrl || null,
        })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Kaydedilemedi')
      setRows(prev => [j.row, ...prev])

      // temizle
      setTitle(''); setAuthors(''); setExternalUrl('')
      setFile(null); fileRef.current && (fileRef.current.value = '')
    } catch (e:any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Silinsin mi?')) return
    const r = await fetch('/api/admin/pastpapers/delete', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ id })
    })
    const j = await r.json()
    if (!r.ok) return alert(j.error || 'Silinemedi')
    setRows(prev => prev.filter(x => x.id !== id))
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Geçmiş Bildiriler (Admin)</h1>

      <form onSubmit={addRow} className="grid md:grid-cols-2 gap-4 border rounded p-4">
        <label className="block">
          <div className="text-sm">Yıl*</div>
          <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))}
                 className="mt-1 w-full border rounded p-2" />
        </label>
        <label className="block md:col-span-2">
          <div className="text-sm">Başlık*</div>
          <input value={title} onChange={e=>setTitle(e.target.value)}
                 className="mt-1 w-full border rounded p-2" />
        </label>
        <label className="block md:col-span-2">
          <div className="text-sm">Yazarlar (ops.)</div>
          <input value={authors} onChange={e=>setAuthors(e.target.value)}
                 className="mt-1 w-full border rounded p-2" placeholder="Ad Soyad; Ad Soyad; ..." />
        </label>
        <label className="block">
          <div className="text-sm">Dosya (PDF/DOC/DOCX) (ops.)</div>
          <input ref={fileRef} type="file"
                 accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                 onChange={e=>setFile(e.target.files?.[0] || null)} />
        </label>
        <label className="block">
          <div className="text-sm">Harici Link (ops.)</div>
          <input value={externalUrl} onChange={e=>setExternalUrl(e.target.value)}
                 className="mt-1 w-full border rounded p-2" placeholder="https://..." />
        </label>
        <div className="md:col-span-2">
          <button disabled={saving} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
            {saving ? 'Kaydediliyor…' : 'Ekle'}
          </button>
        </div>
      </form>

      {loading ? (
        <div>Yükleniyor…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : rows.length === 0 ? (
        <div>Henüz kayıt yok.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map(r => (
            <div key={r.id} className="border rounded p-4">
              <div className="text-sm text-black/60">{r.year}</div>
              <div className="font-semibold">{r.title}</div>
              {r.authors && <div className="text-sm mt-1">{r.authors}</div>}
              <div className="mt-2 flex items-center gap-3">
                {r.file_path && (
                  <a className="text-blue-600 underline" target="_blank"
                     href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_PAST_BUCKET}/${r.file_path}`}>
                    Dosya
                  </a>
                )}
                {r.external_url && (
                  <a className="text-blue-600 underline" target="_blank" href={r.external_url}>
                    Dış Link
                  </a>
                )}
                <button onClick={() => remove(r.id!)} className="px-3 py-1 rounded border hover:bg-gray-50">
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
