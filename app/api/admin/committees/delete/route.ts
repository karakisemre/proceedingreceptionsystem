import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const { id } = await req.json()
  const sb = supabaseServer()
  const { error } = await sb.from('committee_members').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
