import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  const sb = supabaseServer()

  // önce oku
  let { data, error } = await sb.from('committee_groups').select('*').order('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // boşsa seed et
  if (!data || data.length === 0) {
    const seed = [
      { slug: 'duzenleme', title: 'Düzenleme Kurulu' },
      { slug: 'bilim',     title: 'Bilim Kurulu' },
      { slug: 'hakem',     title: 'Hakem Kurulu' },
    ]
    const ins = await sb.from('committee_groups').insert(seed).select('*')
    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 })
    data = ins.data ?? []
  }

  return NextResponse.json({ rows: data })
}
