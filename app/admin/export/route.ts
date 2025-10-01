import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  const sb = supabaseServer()
  const { data, error } = await sb.from('procedingreceptions')
    .select('created_at,full_name,email,phone,university,title,presentation,keywords,summary,file_name,file_path')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const header = ['created_at','full_name','email','phone','university','title','presentation','keywords','summary','file_name','file_path']
  const rows = (data ?? []).map(r => header.map(h => {
    const v = (r as any)[h]
    if (Array.isArray(v)) return `"${v.join(', ')}"`
    const s = String(v ?? '')
    return `"${s.replace(/"/g,'""')}"`
  }).join(','))
  const csv = [header.join(','), ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="submissions.csv"'
    }
  })
}
