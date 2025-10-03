import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <nav className="flex flex-wrap gap-2">
        <Tab href="/admin/" label="Başvuru Listesi" />
        <Tab href="/admin/statistics" label="İstatistikler" />
        <Tab href="/admin/sliders" label="Slider" />
        <Tab href="/admin/speakers" label="Konuşmacılar" />
        <Tab href="/admin/committees" label="Kurullar" />
        <Tab href="/admin/workshops" label="Çalıştay & Atölye" />
        <Tab href="/admin/pastpapers" label="Geçmiş Bildiriler" />
      </nav>
      {children}
    </main>
  )
}

function Tab({ href, label }: { href:string; label:string }) {
  return (
    <Link href={href} className="px-3 py-2 rounded border hover:bg-gray-50">{label}</Link>
  )
}
