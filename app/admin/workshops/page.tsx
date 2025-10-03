'use client'
import { useEffect, useRef, useState } from 'react'

type Row = {
  id?: string
  title: string
  facilitator: string
  slot?: string | null
  location?: string | null
  capacity?: number | null
  description?: string | null
  img_path?: string | null
  is_active?: boolean
}

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const ct = res.headers.get('content-type') || ''
  const body = ct.includes('application/json') ? await res.json() : await res.text()
  if (!res.ok) throw new Error(typeof body === 'string' ? body : (body.error || `HTTP ${res.status}`))
  return body
}

export default function WorkshopsAdmin() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  // form state
  const [title, setTitle] = useState('')
  const [facilitator, setFacilitator] = useState('')
  const [slot, setSlot] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    (async () => {
      try {
        const j = await fetchJSON('/api/admin/workshops/list')
        setRows(j.rows || [])
      } catch (e:any) {
        alert(e.message)
      }
    })()
  }, [])

  async function uploadAsset(f: File) {
    // 1) Signed URL al
    const up = await fetchJSON('/api/signed-upload-asset', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ filename: f.name, mime: f.type })
    })
    const { bucket, path, token } = up as { bucket: string; path: string; token: string }

    // 2) Supabase client ile yükle
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await sb.storage.from(bucket).uploadToSignedUrl(path, token, f)
    if (error) throw new Error(error.message)
    return path                           // sadece path döndürüyoruz
  }

  async function addWorkshop(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !facilitator) return alert('Başlık ve Eğitmen zorunlu')
    setLoading(true)
    try {
      let img_path: string | undefined
      if (file) img_path = await uploadAsset(file)

      const payload = {
        title,
        facilitator,
        slot: slot || null,
        location: location || null,
        capacity: capacity === '' ? null : Number(capacity),
        description: description || null,
        img_path,
      }

      const j = await fetchJSON('/api/admin/workshops/create', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      })

      setRows([j.row, ...rows])
      // reset
      setTitle(''); setFacilitator(''); setSlot(''); setLocation('')
      setCapacity(''); setDescription('')
      setFile(null); if (fileRef.current) fileRef.current.value = ''
    } catch (err:any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function remove(id?: string) {
    if (!id) return
    if (!confirm('Silinsin mi?')) return
    try {
      await fetchJSON('/api/admin/workshops/delete', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id })
      })
      setRows(rows.filter(r => r.id !== id))
    } catch (e:any) {
      alert(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Çalıştay & Atölyeler</h1>

      <form onSubmit={addWorkshop} className="grid md:grid-cols-2 gap-4 border rounded p-4">
        <Field label="Başlık*" value={title} onChange={setTitle} />
        <Field label="Eğitmen*" value={facilitator} onChange={setFacilitator} />
        <Field label="Zaman" value={slot} onChange={setSlot} placeholder="22 Mayıs 2026 • 10:00–12:00" />
        <Field label="Yer" value={location} onChange={setLocation} placeholder="EF – A Blok" />

        <label className="block">
          <div className="text-sm">Kapasite</div>
          <input
            type="number"
            min={0}
            value={capacity}
            onChange={e => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
            className="mt-1 w-full border rounded p-2"
          />
        </label>

        <label className="block">
          <div className="text-sm">Görsel (opsiyonel)</div>
          <input ref={fileRef} type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} />
        </label>

        <label className="md:col-span-2 block">
          <div className="text-sm">Açıklama</div>
          <textarea
            value={description}
            onChange={e=>setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full border rounded p-2"
          />
        </label>

        <div className="md:col-span-2">
          <button disabled={loading || !title || !facilitator}
                  className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
            {loading ? 'Kaydediliyor…' : 'Ekle'}
          </button>
        </div>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map(r => (
          <div key={r.id} className="border rounded p-4 space-y-1">
            <div className="text-xs text-black/60">#{r.id}</div>
            <div className="font-semibold">{r.title}</div>
            <div className="text-sm text-black/70"><b>Eğitmen:</b> {r.facilitator}</div>
            {r.slot && <div className="text-sm text-black/70"><b>Zaman:</b> {r.slot}</div>}
            {r.location && <div className="text-sm text-black/70"><b>Yer:</b> {r.location}</div>}
            {r.capacity != null && <div className="text-sm text-black/70"><b>Kapasite:</b> {r.capacity}</div>}
            {r.img_path && <div className="text-xs break-all text-black/60">{r.img_path}</div>}
            {r.description && <div className="text-sm mt-2">{r.description}</div>}
            <div className="pt-2">
              <button onClick={()=>remove(r.id)} className="px-3 py-1 rounded border hover:bg-gray-50">Sil</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }:{
  label:string; value:string; onChange:(v:string)=>void; placeholder?:string
}) {
  return (
    <label className="block">
      <div className="text-sm">{label}</div>
      <input
        value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border rounded p-2"
      />
    </label>
  )
}
