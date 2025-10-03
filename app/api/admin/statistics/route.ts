import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const sb = supabaseServer()
  const { data, error } = await sb
    .from('site_stats')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    row: data ?? {
      id: 1,
      panel_count: 0,
      workshop_count: 0,
      oral_count: 0,
      poster_count: 0,
      event_dates: '',
      theme: '',
      updated_at: null,
    },
  })
}

export async function POST(req: NextRequest) {
  const b = await req.json()
  const sb = supabaseServer()

  const payload = {
    id: 1,
    panel_count: Math.max(0, Number(b.panel_count) || 0),
    workshop_count: Math.max(0, Number(b.workshop_count) || 0),
    oral_count: Math.max(0, Number(b.oral_count) || 0),
    poster_count: Math.max(0, Number(b.poster_count) || 0),
    event_dates: (b.event_dates ?? '').toString().trim().slice(0, 200),
    theme: (b.theme ?? '').toString().trim().slice(0, 300),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await sb
    .from('site_stats')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ row: data })
}
