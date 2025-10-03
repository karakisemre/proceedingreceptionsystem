import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  const group_id = Number(new URL(req.url).searchParams.get('group_id') || 0)
  const sb = supabaseServer()
  const { data, error } = await sb
    .from('committee_members')
    .select('*')
    .eq('group_id', group_id)
    .order('sort_order', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data })
}
