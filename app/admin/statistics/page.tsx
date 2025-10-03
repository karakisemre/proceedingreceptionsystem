'use client'
import { useEffect, useState } from 'react'

type Stats = {
  panel_count: number
  workshop_count: number
  oral_count: number
  poster_count: number
  event_dates?: string
  theme?: string
  updated_at: string | null
}

export default function StatisticsAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/statistics', { cache: 'no-store' })
        const j = await res.json()
        if (!res.ok) throw new Error(j.error || 'Veri alınamadı')
        setStats(j.row)
      } catch (e: any) {
        setErr(e.message)
      }
    })()
  }, [])

  async function save() {
    if (!stats) return
    setSaving(true); setMsg(null); setErr(null)
    try {
      const res = await fetch('/api/admin/statistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Kaydedilemedi')
      setStats(j.row)
      setMsg('Güncellendi ✅')
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  function setNum<K extends keyof Stats>(k: K, v: number) {
    setStats(s => (s ? { ...s, [k]: v } : s))
  }
  function setStr<K extends keyof Stats>(k: K, v: string) {
    setStats(s => (s ? { ...s, [k]: v } : s))
  }

  if (!stats && !err) return <main className="p-6">Yükleniyor…</main>

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">İstatistikler</h1>

      {err && <div className="p-3 rounded bg-red-100 text-red-800">{err}</div>}
      {msg && <div className="p-3 rounded bg-green-100 text-green-800">{msg}</div>}

      {stats && (
        <>
          {/* Tarih & Tema */}
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm text-black/60 mb-1">Kongre Tarihleri (ör. 22–23 Mayıs 2025)</div>
              <input
                value={stats.event_dates ?? ''}
                onChange={e => setStr('event_dates', e.target.value)}
                className="w-full border rounded p-2"
                placeholder="22–23 Mayıs 2025"
              />
            </label>
            <label className="block">
              <div className="text-sm text-black/60 mb-1">Tema (ör. Öğretmenlik Mesleğinde ...)</div>
              <input
                value={stats.theme ?? ''}
                onChange={e => setStr('theme', e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Öğretmenlik Mesleğinde Mevcut Durum ve Uygulamalar"
              />
            </label>
          </div>

          {/* Sayılar */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <NumberCard label="Panel" value={stats.panel_count} onChange={v => setNum('panel_count', v)} />
            <NumberCard label="Atölye" value={stats.workshop_count} onChange={v => setNum('workshop_count', v)} />
            <NumberCard label="Sözlü Bildiri" value={stats.oral_count} onChange={v => setNum('oral_count', v)} />
            <NumberCard label="Poster" value={stats.poster_count} onChange={v => setNum('poster_count', v)} />
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={saving}
              onClick={save}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>

            <button
              onClick={() =>
                setStats(s => s && { ...s, panel_count: 0, workshop_count: 0, oral_count: 0, poster_count: 0 })
              }
              className="px-3 py-2 rounded border hover:bg-gray-50"
            >
              Sayıları Sıfırla
            </button>

            <div className="text-sm text-black/60">
              {stats.updated_at ? `Son güncelleme: ${new Date(stats.updated_at).toLocaleString('tr-TR')}` : ''}
            </div>
          </div>
        </>
      )}
    </main>
  )
}

function NumberCard({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm text-black/60 mb-2">{label}</div>
      <input
        type="number"
        min={0}
        step={1}
        value={value ?? 0}
        onChange={e => onChange(Math.max(0, Number(e.target.value)))}
        className="w-full border rounded p-2 text-lg font-semibold"
      />
    </div>
  )
}
