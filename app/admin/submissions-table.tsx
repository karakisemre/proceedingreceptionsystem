'use client'
import { useMemo, useState } from 'react'

export type AdminRow = {
  id: string
  full_name: string
  title: string
  created_at: string
  file_url: string
  email?: string
  university?: string
  file_mime?: string
  file_size?: number
}

const PAGE_SIZE = 20

export default function SubmissionsTable({ rows }: { rows: AdminRow[] }) {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((r) =>
      [r.full_name, r.title, r.email, r.university]
        .filter(Boolean)
        .some((f) => (f as string).toLowerCase().includes(term))
    )
  }, [rows, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const start = (page - 1) * PAGE_SIZE
  const pageRows = filtered.slice(start, start + PAGE_SIZE)

  function fmtDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('tr-TR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return iso
    }
  }
  function fmtSize(n?: number) {
    if (!n || n <= 0) return ''
    const mb = n / (1024 * 1024)
    if (mb >= 1) return `${mb.toFixed(2)} MB`
    const kb = n / 1024
    return `${Math.ceil(kb)} KB`
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      alert('Bağlantı kopyalandı.')
    } catch {
      alert('Kopyalanamadı.')
    }
  }

  return (
    <section className="space-y-3">
      {/* üst bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <input
          placeholder="Ara: ad, başlık, e-posta, üniversite…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          className="w-full md:w-80 border rounded p-2"
        />
        <div className="text-sm text-black/60 md:ml-auto">
          {filtered.length} kayıt • {totalPages} sayfa
        </div>
      </div>

      <div className="overflow-auto rounded-xl border">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-neutral-50 sticky top-0">
            <tr className="[&>th]:text-left [&>th]:py-2 [&>th]:px-3">
              <th>Ad</th>
              <th>Başlık</th>
              <th>Tarih</th>
              <th>Dosya</th>
              <th className="whitespace-nowrap">E-posta</th>
              <th>Üniversite</th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-neutral-50/50">
            {pageRows.map((r) => (
              <tr key={r.id} className="[&>td]:py-2 [&>td]:px-3 align-top">
                <td className="font-medium">{r.full_name}</td>
                <td className="max-w-[420px]">
                  <div className="line-clamp-2">{r.title}</div>
                  <div className="text-xs text-black/50 mt-1">
                    {r.file_mime} {fmtSize(r.file_size)}
                  </div>
                </td>
                <td className="whitespace-nowrap">{fmtDate(r.created_at)}</td>
                <td className="whitespace-nowrap">
                  {r.file_url ? (
                    <div className="flex items-center gap-2">
                      <a
                        className="text-blue-600 underline"
                        href={r.file_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        indir
                      </a>
                      <button
                        onClick={() => copyLink(r.file_url)}
                        className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                      >
                        kopyala
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-red-600">link yok</span>
                  )}
                </td>
                <td className="whitespace-nowrap">{r.email}</td>
                <td className="max-w-[280px]">
                  <div className="line-clamp-2">{r.university}</div>
                </td>
              </tr>
            ))}

            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-black/60">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* sayfalama */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          ‹ Önceki
        </button>
        <div className="text-sm">
          {page} / {totalPages}
        </div>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          Sonraki ›
        </button>
      </div>
    </section>
  )
}
