import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const sb = supabaseServer()
  const { data, error } = await sb.from('hero_slides').insert({
    title: body.title ?? null,
    subtitle: body.subtitle ?? null,
    image_path: body.image_path,
    sort_order:  Date.now(),  // kaba sıralama
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status:500 })
  return NextResponse.json({ row: data })
}
