import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

function slugBase(name: string) {
  return name
    .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9-_ ]/g,' ')
    .trim().replace(/\s+/g,'-').toLowerCase()
}

export async function POST(req: NextRequest) {
  try {
    const { filename, mime } = await req.json()
    if (!filename || !mime) {
      return NextResponse.json({ error:'filename ve mime zorunlu' }, { status:400 })
    }

    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowed.includes(mime)) {
      return NextResponse.json({ error:'Sadece PDF/DOC/DOCX' }, { status:415 })
    }

    const BUCKET = process.env.SUPABASE_PAST_BUCKET || 'pastpapers'
    const sb = supabaseServer()
    const today = new Date().toISOString().slice(0,10)
    const dot = filename.lastIndexOf('.')
    const base = dot > -1 ? filename.slice(0,dot) : filename
    const ext  = dot > -1 ? filename.slice(dot+1).toLowerCase() : ''
    const path = `${today}/${randomUUID()}_${slugBase(base)}${ext ? '.'+ext : ''}`

    const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path)
    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'İmzalı URL oluşturulamadı' }, { status:500 })
    }

    return NextResponse.json({ bucket: BUCKET, path, token: data.token })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'Beklenmeyen hata' }, { status:500 })
  }
}
