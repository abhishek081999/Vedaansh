// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s — Jyotish',
    default: 'Jyotish — Vedic Astrology Platform',
  },
  description:
    'Professional Vedic Jyotish platform. Calculate birth charts, Vimshottari Dasha, Navamsha, Panchang — with arc-second precision via Swiss Ephemeris.',
  keywords: ['Jyotish', 'Vedic astrology', 'birth chart', 'Dasha', 'Panchang', 'Navamsha'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Jyotish',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
