import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { notifyOrganizer } from '@/lib/mailer'

export const runtime = 'nodejs'

function wordCount(text: string): number { return (text.trim().match(/\S+/g) || []).length }
function isEmail(s: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) }

const rl = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(5, '1 m'),
  analytics: true
})

const ALLOWED = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const ua = req.headers.get('user-agent') ?? null

    // 1) Rate limit
    const limit = await rl.limit(`submit:${ip ?? 'unknown'}`)
    if (!limit.success) {
      return NextResponse.json({ error: 'Çok fazla istek (rate-limit).' }, { status: 429 })
    }

    // 2) Body
    const json = await req.json()

    // 3) Validasyon
    const required = [
      'degree', 'full_name', 'email', 'university', 'title', 'presentation',
      'keywords', 'summary', 'file_name', 'file_mime', 'file_size', 'file_path'
    ]
    for (const k of required) {
      if (!(k in json)) return NextResponse.json({ error: `${k} alanı zorunlu.` }, { status: 400 })
    }
    if (!['lisans', 'yuksek_lisans', 'doktora'].includes(json.degree)) {
      return NextResponse.json({ error: 'degree geçersiz.' }, { status: 400 })
    }
    if (!['sozlu', 'poster'].includes(json.presentation)) {
      return NextResponse.json({ error: 'presentation geçersiz.' }, { status: 400 })
    }
    if (!isEmail(json.email)) return NextResponse.json({ error: 'Geçerli bir e-posta giriniz.' }, { status: 400 })
    if (!Array.isArray(json.keywords) || json.keywords.length === 0 || json.keywords.length > 10) {
      return NextResponse.json({ error: 'Anahtar kelimeler 1–10 arası olmalı.' }, { status: 400 })
    }
    const wc = wordCount(String(json.summary || ''))
    if (wc > 500) return NextResponse.json({ error: `Özet en fazla 500 kelime olmalı (şu an ${wc}).` }, { status: 400 })
    if (!ALLOWED.includes(json.file_mime)) {
      return NextResponse.json({ error: 'Sadece PDF veya Word yükleyebilirsiniz.' }, { status: 415 })
    }

    // 4) DB insert
    const sb = supabaseServer()
    const { error } = await sb.from('procedingreceptions').insert({
      degree: json.degree,
      full_name: json.full_name,
      phone: json.phone ?? null,
      email: json.email,
      university: json.university,
      title: json.title,
      presentation: json.presentation,
      keywords: json.keywords,
      summary: json.summary,
      file_path: json.file_path,
      file_name: json.file_name,
      file_mime: json.file_mime,
      file_size: json.file_size,
      ip,
      user_agent: ua,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 5) Dosya URL'si — PUBLIC ise getPublicUrl, PRIVATE ise createSignedUrl
    const BUCKET = process.env.SUPABASE_BUCKET
    if (!BUCKET) {
      return NextResponse.json({ error: 'SUPABASE_BUCKET env tanımlı değil.' }, { status: 500 })
    }

    // PUBLIC bucket ise:
    const pub = sb.storage.from(BUCKET).getPublicUrl(json.file_path)
    let file_url = pub?.data?.publicUrl

    // Eğer bucket PRIVATE ise üstteki null gelir; o zaman imzalı link üret:
    if (!file_url) {
      const signed = await sb.storage.from(BUCKET).createSignedUrl(json.file_path, 60 * 60 * 24 * 7) // 7 gün
      if (!signed.data?.signedUrl) {
        return NextResponse.json({ error: 'Dosya linki üretilemedi.' }, { status: 500 })
      }
      file_url = signed.data.signedUrl
    }

    // 6) E-posta
    await notifyOrganizer({
      full_name: json.full_name,
      email: json.email,
      phone: json.phone ?? null,
      university: json.university,
      title: json.title,
      file_url,
      ip, ua
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Beklenmeyen hata' }, { status: 500 })
  }
}
