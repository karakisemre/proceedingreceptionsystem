import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'

// ---- helpers ----
function wordCount(text: string): number {
  return (text.trim().match(/\S+/g) || []).length
}
function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}
async function sendEmail(payload: {
  full_name: string; email: string; phone?: string | null;
  university: string; title: string; file_url: string; ip: string | null; ua: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY!
  const to = process.env.ORGANIZER_EMAIL!
  const from = process.env.FROM_EMAIL!

  const html = `
    <h3>Yeni Başvuru</h3>
    <p><b>Ad Soyad:</b> ${payload.full_name}</p>
    <p><b>E-posta:</b> ${payload.email}</p>
    <p><b>Telefon:</b> ${payload.phone ?? '-'}</p>
    <p><b>Üniversite:</b> ${payload.university}</p>
    <p><b>Başlık:</b> ${payload.title}</p>
    <p><b>Dosya:</b> <a href="${payload.file_url}">${payload.file_url}</a></p>
    <hr/>
    <p><b>IP:</b> ${payload.ip ?? '-'}</p>
    <p><b>UA:</b> ${payload.ua ?? '-'}</p>
  `.trim()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, subject: `Yeni başvuru: ${payload.title}`, html })
  })
  if (!res.ok) throw new Error(`Resend error: ${await res.text()}`)
}

// ---- rate-limit ----
const rl = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(5, '1 m'), // IP başına dakikada 10
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

    // 1) Rate-limit
    const limit = await rl.limit(`submit:${ip ?? 'unknown'}`)
    if (!limit.success) {
      return NextResponse.json({ error: 'Çok fazla istek (rate-limit).' }, { status: 429 })
    }

    // 2) JSON body
    const json = await req.json()

    // 3) Validasyonlar
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
    if (!isEmail(json.email)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta giriniz.' }, { status: 400 })
    }
    if (!Array.isArray(json.keywords) || json.keywords.length === 0 || json.keywords.length > 10) {
      return NextResponse.json({ error: 'Anahtar kelimeler 1–10 arası olmalı.' }, { status: 400 })
    }
    const wc = wordCount(String(json.summary || ''))
    if (wc > 500) {
      return NextResponse.json({ error: `Özet en fazla 500 kelime olmalı (şu an ${wc}).` }, { status: 400 })
    }
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

    // 5) Dosya public URL (bucket public ise)
    const BUCKET = process.env.SUPABASE_BUCKET!
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const file_url = `${base}/storage/v1/object/public/${BUCKET}/${json.file_path}`

    // 6) E-posta bildirimi
    await sendEmail({
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
