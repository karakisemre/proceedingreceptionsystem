'use client'
import { useEffect, useRef, useState } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'

type Group = { id: number; slug: string; title: string }
type Member = {
  id?: string; name: string; role?: string; img_path?: string; bio?: string;
  sort_order?: number; is_active?: boolean
}

export default function CommitteesAdmin() {
  const [groups, setGroups] = useState<Group[]>([])
  const [groupId, setGroupId] = useState<number | null>(null)

  const [rows, setRows] = useState<Member[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [loadingRows, setLoadingRows] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // form
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [bio, setBio] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)

  // Grupları çek
  useEffect(() => {
    (async () => {
      try {
        setLoadingGroups(true)
        const res = await fetch('/api/admin/committees/groups')
        const j = await res.json()
        if (!res.ok) throw new Error(j.error || 'Gruplar alınamadı')
        setGroups(j.rows || [])
        if ((j.rows || []).length > 0) setGroupId(j.rows[0].id)
      } catch (e: any) {
        setErr(e.message)
      } finally {
        setLoadingGroups(false)
      }
    })()
  }, [])

  // Üyeleri çek
  useEffect(() => {
    if (!groupId) { setRows([]); return }
    (async () => {
      try {
        setLoadingRows(true)
        const res = await fetch(`/api/admin/committees/list?group_id=${groupId}`)
        const j = await res.json()
        if (!res.ok) throw new Error(j.error || 'Liste alınamadı')
        setRows(j.rows || [])
      } catch (e: any) {
        alert(e.message)
      } finally {
        setLoadingRows(false)
      }
    })()
  }, [groupId])

  // Storage upload
  async function uploadAsset(f: File) {
    const up = await fetch('/api/signed-upload-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: f.name, mime: f.type }),
    })
    const j = await up.json()
    if (!up.ok) throw new Error(j.error || 'İmzalı yükleme oluşturulamadı')
    const sb = supabaseClient()
    const { error } = await sb.storage.from(j.bucket).uploadToSignedUrl(j.path, j.token, f)
    if (error) throw error
    return j.path as string
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    if (!groupId) return alert('Lütfen grup seçin.')
    if (!name.trim()) return alert('İsim zorunlu.')
    setSaving(true)
    try {
      let img_path: string | undefined
      if (file) img_path = await uploadAsset(file)

      const res = await fetch('/api/admin/committees/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, name, role, img_path, bio }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Kayıt eklenemedi')
      setRows((prev) => [j.row, ...prev])

      // formu temizle
      setName(''); setRole(''); setBio('')
      setFile(null); if (fileRef.current) fileRef.current.value = ''
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Silinsin mi?')) return
    const res = await fetch('/api/admin/committees/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const j = await res.json()
    if (!res.ok) return alert(j.error || 'Silinemedi')
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Kurullar</h1>

      {loadingGroups && <div className="text-sm text-black/60">Gruplar yükleniyor…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="flex gap-3 items-center">
        <span className="text-sm text-black/70">Grup</span>
        <select
          value={groupId ?? ''}
          onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : null)}
          className="border rounded p-2"
          disabled={loadingGroups || groups.length === 0}
        >
          {groups.length === 0 && <option value="">(Grup yok)</option>}
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.title}</option>
          ))}
        </select>
      </div>

      <form onSubmit={addMember} className="grid md:grid-cols-2 gap-4 border rounded p-4">
        <Field label="İsim*" value={name} onChange={setName} />
        <Field label="Ünvan" value={role} onChange={setRole} placeholder="Prof. Dr., Arş. Gör. ..." />
        <label className="block">
          <div className="text-sm">Fotoğraf (opsiyonel)</div>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
        </label>
        <label className="md:col-span-2 block">
          <div className="text-sm">Kısa biyografi (ops.)</div>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="mt-1 w-full border rounded p-2" />
        </label>
        <div className="md:col-span-2">
          <button
            disabled={saving || !groupId || !name.trim()}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor…' : 'Ekle'}
          </button>
        </div>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        {loadingRows ? (
          <div className="text-sm text-black/60">Üyeler yükleniyor…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-black/60">Bu grupta henüz üye yok.</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="border rounded p-3">
              <div className="font-semibold">{r.name}</div>
              {r.role && <div className="text-sm text-black/70">{r.role}</div>}
              {r.img_path && <div className="text-xs mt-2">{r.img_path}</div>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => remove(r.id!)} className="px-3 py-1 rounded border hover:bg-gray-50">Sil</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <div className="text-sm">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border rounded p-2"
      />
    </label>
  )
}
