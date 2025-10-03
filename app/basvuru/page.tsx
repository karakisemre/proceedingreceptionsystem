'use client'
import Image from 'next/image'
import React, { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabaseClient'
import { wordCount } from '@/lib/utils'
import { universitiesTR } from '@/lib/universities'

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

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}
function isPhoneTR(s: string) {
  if (!s) return true
  const cleaned = s.replace(/\D/g, '')
  return cleaned.length === 10 || cleaned.length === 11
}

export default function Page() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    degree: '',
    full_name: '',
    phone: '',
    email: '',
    university: '',
    title: '',
    presentation: '',
  })

  const [keywordsText, setKeywordsText] = useState('')
  const [summary, setSummary] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const wc = useMemo(() => wordCount(summary), [summary])

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  // File helpers
  function handlePickFile() {
    fileInputRef.current?.click()
  }
  function handleRemoveFile() {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)
    setError(null)

    const kw = keywordsText.split(',').map(k => k.trim()).filter(Boolean)

    if (!form.degree) return setError('Unvan seçiniz.')
    if (!form.full_name || form.full_name.length < 3) return setError('Ad-Soyad en az 3 karakter.')
    if (!isPhoneTR(form.phone)) return setError('Telefon formatı geçersiz (örn: 5xx xxx xx xx).')
    if (!isEmail(form.email)) return setError('Geçerli e-posta giriniz.')
    if (!form.university) return setError('Üniversite zorunludur.')
    if (!form.title) return setError('Başlık zorunludur.')
    if (!form.presentation) return setError('Katılım şeklini seçiniz.')

    if (kw.length === 0 || kw.length > MAX_KEYWORDS) return setError(`Anahtar kelimeler 1–${MAX_KEYWORDS} arası olmalı.`)
    if (kw.some(k => k.length > 40)) return setError('Her anahtar kelime 40 karakteri geçmemeli.')

    if (wc > MAX_WORDS) return setError(`Özet en fazla ${MAX_WORDS} kelime olmalı (şu an ${wc}).`)

    if (!file) return setError('Lütfen PDF veya Word dosyası ekleyin.')
    if (file.size > MAX_FILE_MB * 1024 * 1024) return setError(`Dosya en fazla ${MAX_FILE_MB} MB olmalı.`)
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowed.includes(file.type)) return setError('Sadece PDF veya Word dosyası yükleyebilirsiniz.')

    setLoading(true)
    try {
      // 1) İmzalı upload token'ı al
      const upRes = await fetch('/api/signed-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, mime: file.type }),
      })
      const upJson = await upRes.json()
      if (!upRes.ok) throw new Error(upJson.error || 'İmzalı yükleme alınamadı')

      // 2) Dosyayı doğrudan Supabase Storage’a yükle
      const sb = supabaseClient()
      const { error: upErr } = await sb.storage
        .from('procedingreceptions') // bucket adın
        .uploadToSignedUrl(upJson.path, upJson.token, file)
      if (upErr) throw new Error(upErr.message)

      // 3) DB insert
      const subRes = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          keywords: kw,
          summary,
          file_name: file.name,
          file_mime: file.type,
          file_size: file.size,
          file_path: upJson.path,
        }),
      })
      const subJson = await subRes.json()
      if (!subRes.ok) throw new Error(subJson.error || 'Kayıt başarısız')

      setMessage('Yükleme başarılı ve başvurunuz kaydedildi ✅')
      setForm({ degree: '', full_name: '', phone: '', email: '', university: '', title: '', presentation: '' })
      setKeywordsText('')
      setSummary('')
      handleRemoveFile()

      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Beklenmeyen hata')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <Image src="/egitim_fakultesi.png" alt="SDÜ Eğitim Fakültesi Logosu" width={96} height={96}
                 className="h-16 w-16 md:h-24 md:w-24 object-contain" priority />
          <div className="flex-1 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-700">
              SDÜ EFOK 2026 Bildiri Başvuru Formu
            </h1>
          </div>
          <Image src="/sdu.png" alt="Süleyman Demirel Üniversitesi Logosu" width={96} height={96}
                 className="h-16 w-16 md:h-24 md:w-24 object-contain" priority />
        </div>
      </header>

      <p className="text-sm text-gray-600 mb-6">* ile işaretli alanlar zorunludur.</p>

      {message && <div className="p-3 mb-4 rounded bg-green-100 text-green-800" role="status">{message}</div>}
      {error && <div className="p-3 mb-4 rounded bg-red-100 text-red-800" role="alert">{error}</div>}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <fieldset>
          <legend className="font-medium">Unvan*</legend>
          <div className="flex gap-6 mt-2">
            {degreeOpts.map(o => (
              <label key={o.value} className="flex items-center gap-2">
                <input type="radio" name="degree" value={o.value} required
                       checked={form.degree === o.value}
                       onChange={() => setField('degree', o.value)} /> {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Ad-Soyad*</label>
            <input name="full_name" value={form.full_name} onChange={e=>setField('full_name', e.target.value)}
                   required aria-invalid={!form.full_name ? true : undefined}
                   className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Telefon</label>
            <input name="phone" value={form.phone} onChange={e=>setField('phone', e.target.value)}
                   placeholder="5xx xxx xx xx" className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Mail Adresi*</label>
            <input type="email" name="email" value={form.email} onChange={e=>setField('email', e.target.value)}
                   required className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Üniversite*</label>
            <select
              name="university"
              value={form.university}
              onChange={e => setField('university', e.target.value)}
              required
              className="mt-1 w-full border rounded p-2">
              <option value="">-- Üniversite Seçiniz --</option>
              {universitiesTR.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
                    
        </div>

        <div>
          <label className="block text-sm font-medium">Bildiri Başlığı*</label>
          <input name="title" value={form.title} onChange={e=>setField('title', e.target.value)}
                 required className="mt-1 w-full border rounded p-2" />
        </div>

        <fieldset>
          <legend className="font-medium">Katılım şekli*</legend>
          <div className="flex gap-6 mt-2">
            {presentationOpts.map(o => (
              <label key={o.value} className="flex items-center gap-2">
                <input type="radio" name="presentation" value={o.value} required
                       checked={form.presentation === o.value}
                       onChange={() => setField('presentation', o.value)} /> {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="block text-sm font-medium">Anahtar Kelimeler (virgülle ayırın, en fazla 10)</label>
          <input value={keywordsText} onChange={e=>setKeywordsText(e.target.value)}
                 placeholder="ör. yapay zeka, drone, rota planlama"
                 className="mt-1 w-full border rounded p-2" />
          <p className="text-xs text-gray-500 mt-1">Örnek: "makine öğrenmesi, görüntü işleme, optimizasyon"</p>
        </div>

        <div>
          <label className="block text-sm font-medium">Özet (en fazla 500 kelime)*</label>
          <textarea name="summary" required value={summary} onChange={e=>setSummary(e.target.value)}
                    rows={8} className="mt-1 w-full border rounded p-2" />
          <div className="text-xs mt-1">Kelime sayısı: {wc} / {MAX_WORDS}</div>
        </div>

        {/* ==== Özel Dosya Seç Butonu ==== */}
        <div>
          <label className="block text-sm font-medium">Dosya Yükleme (PDF/Word, max {MAX_FILE_MB} MB)*</label>

          {/* gizli input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)}
            required
          />

          <div className="mt-1 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handlePickFile}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              <span>📎</span> {file ? 'Dosyayı Değiştir' : 'Dosya Seç'}
            </button>

            {file && (
              <>
                <span className="text-sm text-gray-700 truncate max-w-[280px]" title={file.name}>
                  {file.name} ({Math.ceil(file.size/1024)} KB)
                </span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-sm text-gray-600 underline hover:text-gray-800"
                >
                  Kaldır
                </button>
              </>
            )}
          </div>
        </div>
        {/* ==== /Özel Dosya Seç Butonu ==== */}

        <button disabled={loading} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
          {loading ? 'Gönderiliyor…' : 'Gönder'}
        </button>
      </form>
    </main>
  )
}
