import './globals.css'
import type { Metadata } from 'next'
import React from 'react'
import MainNav from './components/MainNav'

export const metadata: Metadata = {
  title: 'EFOK 2026 Bildiri Alım',
  icons: {
    icon: '/favicon.ico',        // DİKKAT: /public yazılmaz; kökten /favicon.ico
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-dvh">
        <MainNav />
        {children}
      </body>
    </html>
  )
}
