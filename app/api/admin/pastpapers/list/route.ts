import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // her çağrıda taze veri

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? Math.max(1, Math.min(1000, Number(limitParam))) : null

    const sb = supabaseServer()
    let q = sb.from('past_papers')
      .select('*')
      .order('year', { ascending: false })
      .order('sort_order', { ascending: false })

    if (limit) q = q.limit(limit)

    const { data, error } = await q

    if (error) {
      return NextResponse.json(
        { error: error.message, details: error.details, hint: error.hint, code: (error as any).code },
        { status: 500 }
      )
    }

    return NextResponse.json({ rows: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 })
  }
}
