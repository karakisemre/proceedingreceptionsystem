import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()

    const year = Number(b?.year)
    const title = String(b?.title || '').trim()
    if (!year || !title) {
      return NextResponse.json({ error: 'year ve title zorunlu' }, { status: 400 })
    }

    const payload = {
      year,
      title,
      authors: b?.authors ? String(b.authors).trim() : null,
      file_path: b?.file_path || null,
      file_mime: b?.file_mime || null,
      external_url: b?.external_url ? String(b.external_url).trim() : null,
      sort_order: Date.now(), // isteğe göre bigint sıralama alanı
    }

    const sb = supabaseServer()
    const { data, error } = await sb.from('past_papers').insert(payload).select().single()

    if (error) {
      return NextResponse.json(
        { error: error.message, details: error.details, hint: error.hint, code: (error as any).code },
        { status: 500 }
      )
    }

    return NextResponse.json({ row: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 })
  }
}
