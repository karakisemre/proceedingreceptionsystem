'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'

type Slide = {
  src: string
  alt: string
  title: string
  subtitle?: string
  ratio?: string
  pos?: string
}

export default function HeroSlider({
  slides,
  interval = 5000,
  fit = 'cover',
}: {
  slides: Slide[]
  interval?: number
  fit?: 'cover' | 'contain'
}) {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => setI(p => (p + 1) % slides.length), interval)
    return () => clearInterval(t)
  }, [slides.length, interval])

  if (!slides?.length) return null
  const ratio = slides[i]?.ratio ?? '16/9'

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow z-0" style={{ aspectRatio: ratio }}>
      {slides.map((s, idx) => (
        <Image
          key={idx}
          src={s.src}
          alt={s.alt}
          fill
          priority={idx === 0}
          sizes="100vw"
          unoptimized
          className={`transition-opacity duration-700 ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${i === idx ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectPosition: s.pos ?? 'center center' }}
        />
      ))}
      <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none" />
      <div className="absolute bottom-6 left-6 right-6 text-white z-20 pointer-events-none">
        <h2 className="text-2xl md:text-4xl font-bold drop-shadow">{slides[i].title}</h2>
        {slides[i].subtitle && <p className="mt-2 max-w-2xl">{slides[i].subtitle}</p>}
      </div>
    </div>
  )
}
