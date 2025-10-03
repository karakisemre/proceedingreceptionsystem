import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const sb = supabaseServer()
  const { data, error } = await sb.from('speakers').insert({
    name: body.name,
    title: body.title ?? null,
    org: body.org ?? null,
    talk_title: body.talk_title ?? null,
    talk_slot: body.talk_slot ?? null,
    img_path: body.img_path ?? null,
    bio: body.bio ?? null,
    sort_order: Date.now(),
    is_active: true,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ row: data })
}
