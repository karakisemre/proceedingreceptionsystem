import Image from 'next/image'

export const metadata = { title: 'İletişim | EFOK 2026' }

export default function IletisimPage() {
  return (
    <main className="relative">
      {/* Üst görsel (background.jpg) */}
      <div className="relative h-[40vh] min-h-[280px] w-full overflow-hidden">
        <Image
          src="/background.jpg"
          alt="EFOK arka planı"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow">İletişim</h1>
        </div>
      </div>

      {/* İçerik + Harita */}
      <section className="mx-auto max-w-5xl p-6 -mt-10 relative">
        <div className="grid md:grid-cols-2 gap-6 rounded-2xl border bg-white/90 backdrop-blur p-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">İletişim Bilgileri</h2>
            <p><b>Yer:</b> SDÜ Eğitim Fakültesi, Doğu Yerleşkesi</p>
            <p><b>E-posta:</b> <a className="underline" href="mailto:sduefok@gmail.com">sduefok@gmail.com</a></p>
            <p><b>Instagram:</b> <a className="underline" href="https://instagram.com/sduefok" target="_blank" rel="noreferrer">@sduefok</a></p>
          </div>

          <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border">
            <iframe
              src="https://www.google.com/maps?q=S%C3%BCleyman%20Demirel%20%C3%9Cniversitesi%20E%C4%9Fitim%20Fak%C3%BCltesi,%20Isparta&output=embed"
              loading="lazy"
              allowFullScreen
              className="w-full h-full"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </main>
  )
}
