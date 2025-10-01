import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/../../lib/supabaseServer'
import { FormSchema } from '@/../../types/form'


export const runtime = 'nodejs'


export async function POST(req: NextRequest) {
try {
const ip = req.headers.get('x-forwarded-for') ?? null
const ua = req.headers.get('user-agent') ?? null


const json = await req.json()
const parsed = FormSchema.safeParse(json)
if (!parsed.success) {
return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
}


const sb = supabaseServer()
const { error } = await sb.from('procedingreceptions').insert({
degree: parsed.data.degree,
full_name: parsed.data.full_name,
phone: parsed.data.phone ?? null,
email: parsed.data.email,
university: parsed.data.university,
title: parsed.data.title,
presentation: parsed.data.presentation,
keywords: parsed.data.keywords,
summary: parsed.data.summary,
file_path: parsed.data.file_path,
file_name: parsed.data.file_name,
file_mime: parsed.data.file_mime,
file_size: parsed.data.file_size,
ip: ip,
user_agent: ua
})


if (error) {
return NextResponse.json({ error: error.message }, { status: 500 })
}


return NextResponse.json({ ok: true })
} catch (e: any) {
return NextResponse.json({ error: e?.message || 'Beklenmeyen hata' }, { status: 500 })
}
}