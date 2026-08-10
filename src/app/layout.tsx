// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import Script from 'next/script'
import { Playfair_Display, Inter, Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider }      from '@/components/providers/SessionProvider'
import { AppLayoutProvider } from '@/components/providers/LayoutProvider'
import { ChartProvider }     from '@/components/providers/ChartProvider'
import { ChartStyleProvider } from '@/components/providers/ChartStyleProvider'
import { AppFramework }      from '@/components/ui/AppFramework'
import { YantraBackdropRoute } from '@/components/ui/YantraBackdropRoute'
import { SITE_URL } from '@/lib/seo/site'

// ── Fonts (next/font — zero layout shift, self-hosted) ────────
const playfair = Playfair_Display({
  subsets:  ['latin'],
  weight:   ['400', '600', '700', '800'],
  style:    ['normal', 'italic'],
  variable: '--font-playfair',
  display:  'swap',
})
const inter = Inter({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700'],
  variable: '--font-inter',
  display:  'swap',
})
const outfit = Outfit({
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
  display:  'swap',
})
const jetbrainsMono = JetBrains_Mono({
  subsets:  ['latin'],
  weight:   ['400'],
  variable: '--font-jetbrains-mono',
  display:  'swap',
})

// ── Google Analytics 4 ───────────────────────────────────────
const GA_ID = 'G-FPWC15LRJY'
const gaScript = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { page_path: window.location.pathname });
`.trim()

// ── Prevent theme flash ───────────────────────────────────────
const themeScript = `(function(){try{var t=localStorage.getItem('jyotish-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':t==='dark'?'dark':'classic')}catch(e){}})();`

const BASE_URL = SITE_URL

// ── Root metadata ─────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    template: '%s — Vedaansh',
    default:  'Vedaansh — Free Vedic Astrology & Jyotisha Platform',
  },

  description:
    'Calculate free Vedic birth charts (Kundali), Vimshottari Dasha, Navamsha, all 41 varga charts, Panchang & Arudhas. Arc-second accuracy via Swiss Ephemeris. No login required.',

  keywords: [
    'Vedic astrology', 'Jyotish', 'Jyotisha', 'kundali', 'free kundali', 'birth chart', 'free horoscope',
    'Vimshottari Dasha', 'Navamsha', 'D9 chart', 'Panchang', 'Arudha Lagna',
    'Rahu Kalam', 'Nakshatra', 'Muhurta', 'Kundali matching', 'Ashtakoot',
    'Swiss Ephemeris', 'Vedaansh', 'Lahiri ayanamsha', 'divisional charts', 'varga charts',
  ],

  authors:  [{ name: 'Vedaansh' }],
  creator:  'Vedaansh',
  publisher:'Vedaansh',

  // ── Open Graph ──────────────────────────────────────────────
  openGraph: {
    type:      'website',
    locale:    'en_IN',
    url:        BASE_URL,
    siteName:  'Vedaansh',
    title:     'Vedaansh — Free Vedic Astrology Platform',
    description:
      'Free Vedic birth charts, Dasha, 41 vargas, Panchang. Swiss Ephemeris precision.',
    images: [{
      url:    '/og-default.png',
      width:  1200,
      height: 630,
      alt:    'Vedaansh — Vedic Astrology Platform',
    }],
  },

  // ── Twitter card ────────────────────────────────────────────
  twitter: {
    card:        'summary_large_image',
    site:        '@vedaansh',
    title:       'Vedaansh — Free Vedic Astrology',
    description: 'Free birth charts, Dasha, 41 vargas, Panchang. Swiss Ephemeris precision.',
    images:      ['/og-default.png'],
  },

  // ── Canonical & alternates ──────────────────────────────────
  alternates: {
    canonical: BASE_URL,
    languages: { 'en-IN': BASE_URL },
  },

  // ── Robots ──────────────────────────────────────────────────
  robots: {
    index:           true,
    follow:          true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),

  // ── App metadata ────────────────────────────────────────────
  applicationName: 'Vedaansh',
  category:        'astrology',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vedaansh',
  },

  // ── Icons ────────────────────────────────────────────────────
  icons: {
    icon:        [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/veda-icon.png', type: 'image/png' },
    ],
    shortcut:    '/favicon.ico',
    apple:       '/apple-touch-icon.png',
    other:       [{ rel: 'mask-icon', url: '/veda-icon.png' }],
  },
}

// ── Viewport ──────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#0b0b14' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
  width:          'device-width',
  initialScale:    1,
  maximumScale:    5,
  viewportFit:     'cover',
}

// ── JSON-LD Schemas ───────────────────────────────────────────
const jsonLdWebSite = {
  '@context':    'https://schema.org',
  '@type':       'WebSite',
  name:          'Vedaansh',
  url:           BASE_URL,
  inLanguage:    'en-IN',
  description:   'Free Vedic astrology platform — birth charts, Dasha, 41 vargas, Panchang.',
  publisher:     { '@type': 'Organization', name: 'Vedaansh', url: BASE_URL },
}

const jsonLdWebApp = {
  '@context':          'https://schema.org',
  '@type':             'WebApplication',
  name:                'Vedaansh',
  url:                 BASE_URL,
  inLanguage:          'en-IN',
  applicationCategory: 'LifestyleApplication',
  operatingSystem:     'All',
  browserRequirements: 'Requires JavaScript',
  offers: {
    '@type':         'Offer',
    price:           '0',
    priceCurrency:   'INR',
    availability:    'https://schema.org/InStock',
  },
  description: 'Calculate free Vedic birth charts (Kundali), Vimshottari Dasha, Navamsha, all 41 varga charts, Panchang & Arudhas with arc-second Swiss Ephemeris accuracy.',
  featureList: [
    'Free Vedic birth chart (Kundali)',
    'Vimshottari and Yogini Dasha',
    '41 varga divisional charts',
    'Daily Panchang and Muhurta',
    'Ashtakoot Kundali matching',
    'Nakshatra analysis and remedies',
    'Jaimini Chara Dasha and Karakas',
    'Prashna Krishneeyam horary',
  ],
}

const jsonLdOrg = {
  '@context': 'https://schema.org',
  '@type':    'Organization',
  name:       'Vedaansh',
  url:        BASE_URL,
  logo:       `${BASE_URL}/veda-icon.png`,
  email:      'vedaanshlife@gmail.com',
  sameAs:     [
    'https://twitter.com/vedaansh',
    'https://www.instagram.com/vedaanshlife',
  ],
  contactPoint: {
    '@type':             'ContactPoint',
    email:               'vedaanshlife@gmail.com',
    contactType:         'customer support',
    availableLanguage:   ['English', 'Hindi'],
  },
}

// CSP nonces: proxy sets x-nonce; headers() opts this layout into dynamic SSR.

// ── Root Layout ───────────────────────────────────────────────
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? ''

  return (
    <html lang="en-IN" suppressHydrationWarning data-scroll-behavior="smooth" className={`${playfair.variable} ${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="lazyOnload"
          nonce={nonce}
        />
        <Script id="ga-init" strategy="lazyOnload" nonce={nonce}>
          {gaScript}
        </Script>
        <link rel="icon" type="image/png" href="/veda-icon.png" sizes="any" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Vedaansh" />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
      </head>
      <body>
        <AuthProvider>
          <AppLayoutProvider>
            <ChartProvider>
              <ChartStyleProvider>
                <YantraBackdropRoute />
                <AppFramework>
                  {children}
                </AppFramework>
              </ChartStyleProvider>
            </ChartProvider>
          </AppLayoutProvider>
        </AuthProvider>
      </body>
    </html>
  )
}