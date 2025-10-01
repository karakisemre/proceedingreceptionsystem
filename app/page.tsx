'use client'
import { useState, useMemo } from 'react'
import { z } from 'zod'
import { supabaseClient } from '@/../../lib/supabaseClient'
import { wordCount } from '@/../../lib/utils'

const degreeOpts = [
  { value: 'lisans', label: 'Lisans öğrencisi' },
  { value: 'yuksek_lisans', label: 'Yüksek lisans öğrencisi' },
  { value: 'doktora', label: 'Doktora öğrencisi' },
] as const

const presentationOpts = [
  { value: 'sozlu', label: 'Sözlü Sunum' },
  { value: 'poster', label: 'Poster Sunumu' },
] as const

const MAX_WORDS = 500
const MAX_KEYWORDS = 10
const MAX_FILE_MB = 10

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string|null>(null)
  const [error, setError] = useState<string|null>(null)
  const [keywords, setKeywords] = useState<string>('')
  const [summary, setSummary] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const wc = useMemo(() => wordCount(summary), [summary])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    const degree = String(formData.get('degree') || '')
    const full_name = String(formData.get('full_name') || '')
    const phone = String(formData.get('phone') || '')
    const email = String(formData.get('email') || '')
    const university = String(formData.get('university') || '')
    const title = String(formData.get('title') || '')
    const presentation = String(formData.get('presentation') || '')

    // Keywords: virgülle ayrılmış
    const kw = keywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)

    if (kw.length === 0 || kw.length > MAX_KEYWORDS) {
      setError(`Anahtar kelimeler 1–${MAX_KEYWORDS} arası olmalı.`)
      return
    }

    if (wc > MAX_WORDS) {
      setError(`Özet en fazla ${MAX_WORDS} kelime olmalı (şu an ${wc}).`)
      return
    }

    if (!file) {
      setError('Lütfen PDF veya Word dosyası ekleyin.')
      return
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Dosya en fazla ${MAX_FILE_MB} MB olmalı.`)
      return
    }

    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type)) {
      setError('Sadece PDF veya Word dosyası yükleyebilirsiniz.')
      return
    }

    setLoading(true)
    try {
      // 1) Sunucudan imzalı upload token iste
      const upRes = await fetch('/api/signed-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, mime: file.type })
      })
      const upJson = await upRes.json()
      if (!upRes.ok) throw new Error(upJson.error || 'İmzalı yükleme alınamadı')

      // 2) Token ile dosyayı doğrudan Supabase Storage’a yükle
      const sb = supabaseClient()
      const { error: upErr } = await sb.storage
        .from('procedingreceptions')
        .uploadToSignedUrl(upJson.path, upJson.token, file)

      if (upErr) throw new Error(upErr.message)

      // 3) Metadata + form verisini DB’ye yaz
      const subRes = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          degree,
          full_name,
          phone: phone || undefined,
          email,
          university,
          title,
          presentation,
          keywords: kw,
          summary,
          file_name: file.name,
          file_mime: file.type,
          file_size: file.size,
          file_path: upJson.path
        })
      })
      const subJson = await subRes.json()
      if (!subRes.ok) throw new Error(subJson.error || 'Kayıt başarısız')

      setMessage('Başvurunuz alındı. Teşekkürler!')
      form.reset()
      setKeywords('')
      setSummary('')
      setFile(null)
    } catch (err: any) {
      setError(err.message || 'Beklenmeyen hata')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">Bildiri Başvuru Formu</h1>
      <p className="text-sm text-gray-600 mb-6">* ile işaretli alanlar zorunludur.</p>

      {message && <div className="p-3 mb-4 rounded bg-green-100 text-green-800">{message}</div>}
      {error && <div className="p-3 mb-4 rounded bg-red-100 text-red-800">{error}</div>}

      <form onSubmit={onSubmit} className="space-y-4">
        <fieldset>
          <legend className="font-medium">Unvan*</legend>
          <div className="flex gap-6 mt-2">
            {degreeOpts.map(o => (
              <label key={o.value} className="flex items-center gap-2">
                <input type="radio" name="degree" value={o.value} required /> {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Ad‑Soyad*</label>
            <input name="full_name" required className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Telefon</label>
            <input name="phone" placeholder="5xx xxx xx xx" className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Mail Adresi*</label>
            <input type="email" name="email" required className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Üniversite*</label>
            <input name="university" required className="mt-1 w-full border rounded p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Bildiri Başlığı*</label>
          <input name="title" required className="mt-1 w-full border rounded p-2" />
        </div>

        <fieldset>
          <legend className="font-medium">Katılım şekli*</legend>
          <div className="flex gap-6 mt-2">
            {presentationOpts.map(o => (
              <label key={o.value} className="flex items-center gap-2">
                <input type="radio" name="presentation" value={o.value} required /> {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="block text-sm font-medium">Anahtar Kelimeler (virgülle ayırın, en fazla 10)</label>
          <input
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="ör. yapay zeka, drone, rota planlama"
            className="mt-1 w-full border rounded p-2"
          />
          <p className="text-xs text-gray-500 mt-1">Örnek: "makine öğrenmesi, görüntü işleme, optimizasyon"</p>
        </div>

        <div>
          <label className="block text-sm font-medium">Özet (en fazla 500 kelime)*</label>
          <textarea
            name="summary"
            required
            value={summary}
            onChange={e => setSummary(e.target.value)}
            rows={8}
            className="mt-1 w-full border rounded p-2"
          />
          <div className="text-xs mt-1">Kelime sayısı: {wc} / {MAX_WORDS}</div>
        </div>

        <div>
          <label className="block text-sm font-medium">Dosya Yükleme (PDF/Word, max {MAX_FILE_MB} MB)*</label>
          <input
            required
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="mt-1"
          />
        </div>

        <button
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? 'Gönderiliyor…' : 'Gönder'}
        </button>
      </form>

      <hr className="my-8" />
      <p className="text-xs text-gray-500">Bu formu göndererek kişisel verilerinizin başvuru değerlendirme amacıyla işleneceğini kabul etmiş olursunuz.</p>
    </main>
  )
}