import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 })

  const sb = supabaseServer()
  const { error } = await sb.from('workshops').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
