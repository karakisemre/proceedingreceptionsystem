'use client'
import { useEffect, useRef, useState } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'

type Speaker = {
  id?: string
  name: string
  title?: string
  org?: string
  talk_title?: string
  talk_slot?: string
  img_path?: string
  bio?: string
  sort_order?: number
  is_active?: boolean
}

export default function SpeakersAdmin() {
  const [rows, setRows] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(false)

  // form
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [org, setOrg] = useState('')
  const [talkTitle, setTalkTitle] = useState('')
  const [talkSlot, setTalkSlot] = useState('')
  const [bio, setBio] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/speakers/list')
      const j = await res.json()
      if (res.ok) setRows(j.rows || [])
      else alert(j.error || 'Liste alınamadı')
    })()
  }, [])

  async function uploadAsset(f: File) {
    const up = await fetch('/api/signed-upload-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: f.name, mime: f.type }),
    })
    const j = await up.json()
    if (!up.ok) throw new Error(j.error || 'upload url')

    const sb = supabaseClient()
    const { error } = await sb.storage
      .from(j.bucket)
      .uploadToSignedUrl(j.path, j.token, f)
    if (error) throw error
    return j.path as string
  }

  async function addSpeaker(e: React.FormEvent) {
    e.preventDefault()
    if (!name) return alert('İsim zorunlu')
    setLoading(true)
    try {
      let img_path: string | undefined
      if (file) img_path = await uploadAsset(file)

      const res = await fetch('/api/admin/speakers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          title,
          org,
          talk_title: talkTitle,
          talk_slot: talkSlot,
          img_path,
          bio,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'create')
      setRows([j.row, ...rows])
      setName(''); setTitle(''); setOrg(''); setTalkTitle(''); setTalkSlot(''); setBio('')
      setFile(null); if (fileRef.current) fileRef.current.value = ''
    } catch (err: any) {
      alert(err.message)
    } finally { setLoading(false) }
  }

  async function remove(id: string) {
    if (!confirm('Silinsin mi?')) return
    const res = await fetch('/api/admin/speakers/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    const j = await res.json()
    if (!res.ok) return alert(j.error || 'delete')
    setRows(rows.filter(r => r.id !== id))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Davetli Konuşmacılar</h1>

      <form onSubmit={addSpeaker} className="grid md:grid-cols-2 gap-4 border rounded p-4">
        <Field label="İsim*" value={name} onChange={setName} />
        <Field label="Ünvan" value={title} onChange={setTitle} placeholder="Prof. Dr., Dr. Öğr. Üyesi..." />
        <Field label="Kurum/Birim" value={org} onChange={setOrg} />
        <Field label="Konuşma başlığı" value={talkTitle} onChange={setTalkTitle} />
        <Field label="Zaman (örn: 22 Mayıs 2025 · 10:30)" value={talkSlot} onChange={setTalkSlot} />
        <label className="block">
          <div className="text-sm">Görsel (jpg/png/webp)</div>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
        </label>
        <label className="md:col-span-2 block">
          <div className="text-sm">Kısa biyografi</div>
          <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={4} className="mt-1 w-full border rounded p-2" />
        </label>
        <div className="md:col-span-2">
          <button disabled={loading || !name} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">Ekle</button>
        </div>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map(r => (
          <div key={r.id} className="border rounded p-3">
            <div className="text-sm text-black/60">#{r.sort_order ?? 0} {r.is_active ? '' : '(pasif)'}</div>
            <div className="font-semibold">{r.name}</div>
            <div className="text-sm text-black/70">{[r.title, r.org].filter(Boolean).join(' • ')}</div>
            {r.talk_title && <div className="text-sm mt-1"><b>Konuşma:</b> {r.talk_title}</div>}
            {r.talk_slot && <div className="text-xs text-black/60">{r.talk_slot}</div>}
            <div className="mt-2 text-xs">{r.img_path}</div>
            <div className="mt-3 flex gap-2">
              <button onClick={()=>remove(r.id!)} className="px-3 py-1 rounded border hover:bg-gray-50">Sil</button>
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
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
             className="mt-1 w-full border rounded p-2" />
    </label>
  )
}
