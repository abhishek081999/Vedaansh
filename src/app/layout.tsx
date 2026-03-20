// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s — Vedic Amrit',
    default: 'Vedic Amrit — Professional Jyotiṣa Platform',
  },
  description:
    'Vedic Amrit is a professional Jyotish platform. Calculate birth charts, Vimshottari Dasha, Navamsha, Panchang — with arc-second precision via Swiss Ephemeris.',
  keywords: ['Vedic Amrit', 'Jyotish', 'Vedic astrology', 'birth chart', 'Dasha', 'Panchang', 'Navamsha'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Vedic Amrit',
  },
}

// Inline script injected before first paint — prevents theme flash
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('jyotish-theme');
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  } catch(e){}
})();
`

import { AuthProvider } from '@/components/providers/SessionProvider'
import { AppLayoutProvider } from '@/components/providers/LayoutProvider'
import { AppFramework } from '@/components/ui/AppFramework'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AuthProvider>
          <AppLayoutProvider>
            <AppFramework>
              {children}
            </AppFramework>
          </AppLayoutProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
