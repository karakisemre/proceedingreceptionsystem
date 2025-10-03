import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const id = String(b?.id || '').trim()
    if (!id) {
      return NextResponse.json({ error: 'id zorunlu' }, { status: 400 })
    }

    const sb = supabaseServer()

    // Önce kaydı al (storage dosyasını da silebilmek için)
    const { data: row, error: getErr } = await sb.from('past_papers').select('*').eq('id', id).maybeSingle()
    if (getErr) {
      return NextResponse.json(
        { error: getErr.message, details: getErr.details, hint: getErr.hint, code: (getErr as any).code },
        { status: 500 }
      )
    }
    if (!row) return NextResponse.json({ ok: true }) // zaten yok

    // DB'den sil
    const { error: delErr } = await sb.from('past_papers').delete().eq('id', id)
    if (delErr) {
      return NextResponse.json(
        { error: delErr.message, details: delErr.details, hint: delErr.hint, code: (delErr as any).code },
        { status: 500 }
      )
    }

    // Storage dosyasını da sil (varsa)
    try {
      if (row.file_path) {
        const BUCKET = process.env.SUPABASE_PAST_BUCKET!
        await sb.storage.from(BUCKET).remove([row.file_path])
      }
    } catch {
      // storage silme hatasını kritik yapmıyoruz
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 })
  }
}
