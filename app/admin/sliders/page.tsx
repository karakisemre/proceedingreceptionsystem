'use client'
import { useEffect, useState, useRef } from 'react'

type Slide = {
  id?: string
  title?: string
  subtitle?: string
  image_path: string
  sort_order?: number
  is_active?: boolean
}

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    const txt = await res.text()
    throw new Error(`${res.status} ${res.statusText} — ${txt.slice(0,120)}…`)
  }
  const j = await res.json()
  if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`)
  return j
}

export default function SliderAdmin() {
  const [rows, setRows] = useState<Slide[]>([])
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [file, setFile] = useState<File|null>(null)

  useEffect(() => {
    (async () => {
      try {
        const j = await fetchJSON('/api/admin/sliders/list')
        setRows(j.rows || [])
      } catch (e:any) { alert(e.message) }
    })()
  }, [])

  async function uploadAsset(f: File) {
    // signed url al
    const up = await fetchJSON('/api/signed-upload-asset', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ filename: f.name, mime: f.type })
    })

    const { bucket, path, token } = up as { bucket:string; path:string; token:string }

    // storage'a yükle
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await sb.storage.from(bucket).uploadToSignedUrl(path, token, f)
    if (error) throw new Error(error.message)
    return { path }
  }

  async function addSlide(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    try {
      const { path } = await uploadAsset(file)
      const j = await fetchJSON('/api/admin/sliders/create', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ title, subtitle, image_path: path })
      })
      setRows([j.row, ...rows])
      setTitle(''); setSubtitle('')
      setFile(null); if (fileRef.current) fileRef.current.value=''
    } catch (err:any) { alert(err.message) }
    finally { setLoading(false) }
  }

  async function remove(id: string) {
    if (!confirm('Silinsin mi?')) return
    try {
      await fetchJSON('/api/admin/sliders/delete', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id })
      })
      setRows(rows.filter(r => r.id !== id))
    } catch (e:any) { alert(e.message) }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addSlide} className="grid md:grid-cols-2 gap-4 border rounded p-4">
        <label className="block">
          <div className="text-sm">Başlık</div>
          <input value={title} onChange={e=>setTitle(e.target.value)}
                 className="mt-1 w-full border rounded p-2"/>
        </label>
        <label className="block">
          <div className="text-sm">Alt başlık</div>
          <input value={subtitle} onChange={e=>setSubtitle(e.target.value)}
                 className="mt-1 w-full border rounded p-2"/>
        </label>
        <label className="block">
          <div className="text-sm">Görsel (jpg/png/webp)</div>
          <input ref={fileRef} type="file" accept="image/*"
                 onChange={e=>setFile(e.target.files?.[0]||null)}/>
        </label>
        <div className="flex items-end">
          <button disabled={loading || !file}
                  className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
            Ekle
          </button>
        </div>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map(r => (
          <div key={r.id} className="border rounded p-3">
            <div className="text-sm text-black/60">
              #{r.sort_order ?? 0} {r.is_active ? '' : '(pasif)'}
            </div>
            <div className="font-semibold">{r.title || '(başlık yok)'}</div>
            <div className="text-sm">{r.subtitle}</div>
            <div className="mt-2 text-xs">{r.image_path}</div>
            <div className="mt-3 flex gap-2">
              <button onClick={()=>remove(r.id!)}
                      className="px-3 py-1 rounded border hover:bg-gray-50">
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
