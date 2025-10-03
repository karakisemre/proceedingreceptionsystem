import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const b = await req.json()
  const sb = supabaseServer()

  if (!b.title || !b.facilitator) {
    return NextResponse.json({ error: 'title ve facilitator zorunlu' }, { status: 400 })
  }

  const payload = {
    title: String(b.title).trim(),
    facilitator: String(b.facilitator).trim(),
    slot: b.slot ? String(b.slot).trim() : null,
    location: b.location ? String(b.location).trim() : null,
    capacity: b.capacity != null ? Number(b.capacity) : null,
    description: b.description ? String(b.description).trim() : null,
    img_path: b.img_path || null,   // storage path
    sort_order: Math.floor(Date.now() / 1000), // saniye
    is_active: b.is_active === false ? false : true,
  }

  const { data, error } = await sb
    .from('workshops')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ row: data })
}
