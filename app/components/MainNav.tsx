'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { label: 'Kongre Hakkında', href: '/hakkinda' },
  { label: 'Davetli Konuşmacılar', href: '/konusmacilar' },
  { label: 'Kurullar', href: '/kurullar' },
  { label: 'Çalıştay & Atölyeler', href: '/calistay' },
  { label: 'İletişim', href: '/iletisim' },
]

export default function MainNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-[200] bg-white/80 backdrop-blur border-b ">
      <nav className="mx-auto max-w-6xl flex items-center justify-between gap-6 p-3">
        <Link href="/" className="font-bold tracking-wide hover:opacity-80">
          EFOK 2026
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {items.map(({ label, href }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                data-active={active}
                className="
                  relative font-semibold transition-colors
                  text-neutral-700 hover:text-black
                  after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-black after:transition-all
                  hover:after:w-full
                  data-[active=true]:text-black data-[active=true]:after:w-full
                "
              >
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
