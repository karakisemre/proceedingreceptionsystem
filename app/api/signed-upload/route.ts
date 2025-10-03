import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

// Basit safe-slug (sadece adı slug'layalım, uzantıya dokunmayalım)
function slugBase(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')     // aksanları sil
    .replace(/[^a-zA-Z0-9-_ ]/g, ' ')    // özel karakterleri boşluk yap
    .trim()
    .replace(/\s+/g, '-')                // boşlukları - yap
    .toLowerCase()
}

export async function POST(req: NextRequest) {
  try {
    const { filename, mime } = await req.json()
    if (!filename || !mime) {
      return NextResponse.json({ error: 'filename ve mime zorunlu' }, { status: 400 })
    }

    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!allowed.includes(mime)) {
      return NextResponse.json({ error: 'Sadece PDF veya Word yükleyebilirsiniz.' }, { status: 415 })
    }

    const BUCKET = process.env.SUPABASE_BUCKET
    if (!BUCKET) {
      return NextResponse.json({ error: 'SUPABASE_BUCKET env tanımlı değil.' }, { status: 500 })
    }

    const sb = supabaseServer()
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    // uzantıyı koru
    const dot = filename.lastIndexOf('.')
    const base = dot > -1 ? filename.slice(0, dot) : filename
    const ext  = dot > -1 ? filename.slice(dot + 1).toLowerCase() : ''
    const safe = slugBase(base)
    const path = `${today}/${randomUUID()}_${safe}${ext ? '.' + ext : ''}`

    const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path)
    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'İmzalı URL oluşturulamadı' }, { status: 500 })
    }

    return NextResponse.json({ path, token: data.token })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Beklenmeyen hata' }, { status: 500 })
  }
}
