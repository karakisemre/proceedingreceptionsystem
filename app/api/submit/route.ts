import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

function wordCount(text: string): number {
  return (text.trim().match(/\S+/g) || []).length
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? null
    const ua = req.headers.get('user-agent') ?? null
    const json = await req.json()

    // Basit sunucu validasyonları
    const required = [
      'degree', 'full_name', 'email', 'university', 'title', 'presentation',
      'keywords', 'summary', 'file_name', 'file_mime', 'file_size', 'file_path'
    ]
    for (const k of required) {
      if (!(k in json)) {
        return NextResponse.json({ error: `${k} alanı zorunlu.` }, { status: 400 })
      }
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

    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(json.file_mime)) {
      return NextResponse.json({ error: 'Sadece PDF veya Word yükleyebilirsiniz.' }, { status: 415 })
    }

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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Beklenmeyen hata' }, { status: 500 })
  }
}
