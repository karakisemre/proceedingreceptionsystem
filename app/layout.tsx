import './globals.css'
import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Proceeding Reception',
  icons: {
    icon: '../public/favicon.png',   
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="../public/favicon.png" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  )
}
