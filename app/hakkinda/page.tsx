import { supabaseServer } from '@/lib/supabaseServer'

export const metadata = { title: 'Kongre Hakkında | EFOK 2026' }
export const dynamic = 'force-dynamic'

export default async function HakkindaPage() {
  const sb = supabaseServer()
  const { data } = await sb.from('site_stats').select('*').eq('id', 1).maybeSingle()

  const panel = data?.panel_count ?? 0
  const atolye = data?.workshop_count ?? 0
  const sozlu = data?.oral_count ?? 0
  const poster = data?.poster_count ?? 0
  const dates = data?.event_dates || 'XX–YY'
  const theme = data?.theme || 'Tema'

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Kongre Hakkında</h1>

      <div className="prose max-w-none">
        <p>
          Öğretmenlik mesleği, yalnızca bilgi aktaran değil; aynı zamanda düşünen, sorgulayan, çözüm üreten bireyler
          yetiştiren bir meslektir. Bu bağlamda öğretmen adaylarının akademik donanım kazanmaları kadar, bilgi üretme ve
          paylaşma süreçlerine aktif olarak katılmaları da büyük önem taşımaktadır. Süleyman Demirel Üniversitesi Eğitim
          Fakültesi olarak bu bilinçle düzenlediğimiz Eğitim Fakültesi Öğrenci Kongresi (EFOK), öğretmen adaylarının
          mesleki ve akademik gelişimlerine katkı sunmak amacıyla hayata geçirilmiştir.
        </p>

        <p>
          Bu yıl <b>{dates}</b> tarihlerinde “<b>{theme}</b>” temasıyla gerçekleştirilecek olan kongremiz, fakültemiz
          öğrencilerinin eğitim bilimleri alanındaki güncel gelişmeleri tartışabilecekleri, disiplinler arası bakış
          açılarıyla bilgi üretebilecekleri ve bu bilgiyi farklı formlarda sunabilecekleri bir ortam oluşturmayı
          hedeflemektedir.
        </p>

        <p>
          Kongremiz kapsamında düzenlenen <b>{panel} panel</b>, <b>{atolye} atölye</b>, <b>{sozlu} sözlü bildiri</b> ve
          poster bildirileri; öğretmen adaylarımızın araştırma, sunum ve iletişim becerilerini geliştirmelerine katkı
          sağlamıştır.
        </p>

        <p>
          Bu değerli sürece katkı sunan tüm öğrencilerimize, danışman öğretim elemanlarımıza ve organizasyonda görev alan
          akademik ve idari personelimize içten teşekkür eder, kongremizin ilerleyen yıllarda daha geniş bir katılımla
          gelenekselleşmesini temenni ederiz.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <Stat k="Panel" v={String(panel)} />
        <Stat k="Atölye" v={String(atolye)} />
        <Stat k="Sözlü Bildiri" v={String(sozlu)} />
        <Stat k="Poster" v={String(poster)} />
      </div>
    </main>
  )
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-2xl font-bold">{v}</div>
      <div className="text-xs text-black/60">{k}</div>
    </div>
  )
}
