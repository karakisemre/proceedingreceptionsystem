import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const sb = supabaseServer()
  const { data, error } = await sb.from('committee_members').insert({
    group_id: body.group_id,
    name: body.name,
    role: body.role ?? null,
    img_path: body.img_path ?? null,
    bio: body.bio ?? null,
    sort_order: Date.now(),
    is_active: true,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ row: data })
}
