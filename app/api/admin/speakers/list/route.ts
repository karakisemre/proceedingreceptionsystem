import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  const sb = supabaseServer()
  const { data, error } = await sb.from('speakers').select('*').order('sort_order', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data })
}
