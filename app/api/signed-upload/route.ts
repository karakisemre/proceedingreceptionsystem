import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { slugify } from '@/lib/utils'
import { randomUUID } from 'crypto'


export const runtime = 'nodejs'


export async function POST(req: NextRequest) {
try {
const { filename, mime } = await req.json()
if (!filename || !mime) {
return NextResponse.json({ error: 'filename ve mime zorunlu' }, { status: 400 })
}


// Yalnızca PDF ve Word kabul
const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
if (!allowed.includes(mime)) {
return NextResponse.json({ error: 'Sadece PDF veya Word yükleyebilirsiniz.' }, { status: 415 })
}


const sb = supabaseServer()
const today = new Date().toISOString().slice(0,10) // YYYY-MM-DD
const safe = slugify(filename)
const path = `${today}/${randomUUID()}_${safe}`


const { data, error } = await sb.storage.from('procedingreceptions').createSignedUploadUrl(path)
if (error || !data) {
return NextResponse.json({ error: error?.message || 'İmzalı URL oluşturulamadı' }, { status: 500 })
}


return NextResponse.json({ path, token: data.token })
} catch (e: any) {
return NextResponse.json({ error: e?.message || 'Beklenmeyen hata' }, { status: 500 })
}
}