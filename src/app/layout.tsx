// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import Script from 'next/script'
import { Newsreader, Inter, IBM_Plex_Mono, JetBrains_Mono, Noto_Sans_Devanagari } from 'next/font/google'
import './globals.css'
import { AuthProvider }      from '@/components/providers/SessionProvider'
import { AppLayoutProvider } from '@/components/providers/LayoutProvider'
import { ChartProvider }     from '@/components/providers/ChartProvider'
import { ChartStyleProvider } from '@/components/providers/ChartStyleProvider'
import { AppFramework }      from '@/components/ui/AppFramework'
import { YantraBackdropRoute } from '@/components/ui/YantraBackdropRoute'
import { SITE_URL } from '@/lib/seo/site'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import type { AbstractIntlMessages } from 'next-intl'
import { IntlProvider } from '@/components/providers/IntlProvider'
import { ROOT_CLIENT_NAMESPACES, pickNamespaces } from '@/i18n/messages'
import { LOCALES, LOCALE_TAGS, OG_LOCALES, PATHNAME_HEADER, isAppLocale, localizePath } from '@/i18n/config'

// ── Fonts (next/font — zero layout shift, self-hosted) ────────
// Newsreader: scholarly serif for titles. Holds up from panel headings to the hero.
// Inter: UI, tables, and chart labels.
// IBM Plex Mono: degrees and timings (plain zero, real medium/semibold — not faux bold).
// Noto Sans Devanagari: mantra, SBC aksharas, and Hindi inline with the Latin text.
const newsreader = Newsreader({
  subsets:  ['latin'],
  style:    ['normal', 'italic'],
  variable: '--font-newsreader',
  display:  'swap',
})
const inter = Inter({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700'],
  variable: '--font-inter',
  display:  'swap',
})
const plexMono = IBM_Plex_Mono({
  subsets:  ['latin'],
  weight:   ['400', '500', '600'],
  variable: '--font-plex-mono',
  display:  'swap',
  preload:  false,
})
const jetbrainsMono = JetBrains_Mono({
  subsets:  ['latin'],
  weight:   ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display:  'swap',
  preload:  false,
})
const notoDevanagari = Noto_Sans_Devanagari({
  subsets:  ['devanagari'],
  // 400/700 too: Hindi pages set whole paragraphs and bold headings in it.
  weight:   ['400', '500', '600', '700'],
  variable: '--font-noto-deva',
  display:  'swap',
  preload:  false,
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
const baseMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    template: '%s — Vedaansh',
    default:  'Vedaansh — Free Vedic Astrology & Jyotisha Platform',
  },

  description:
    'Calculate free Vedic birth charts (Kundali), Vimshottari Dasha, Navamsha, 16 Shodashavarga charts, Panchang & Arudhas. Arc-second accuracy via Swiss Ephemeris. No login required.',

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
      'Free Vedic birth charts, Dasha, 16 vargas, Panchang. Swiss Ephemeris precision.',
    images: [{
      url:    '/opengraph-image',
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
    description: 'Free birth charts, Dasha, 16 vargas, Panchang. Swiss Ephemeris precision.',
    images:      ['/opengraph-image'],
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

/** hreflang alternates for the current path (pages may override canonical). */
function localeAlternates(pathname: string, locale: (typeof LOCALES)[number]): Metadata['alternates'] {
  const abs = (l: (typeof LOCALES)[number]) => {
    const p = localizePath(pathname, l)
    return p === '/' ? BASE_URL : `${BASE_URL}${p}`
  }
  return {
    canonical: abs(locale),
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], abs(l)])),
      'x-default': abs('en'),
    },
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale()
  const locale = isAppLocale(rawLocale) ? rawLocale : 'en'
  const t = await getTranslations('common.meta')
  const pathname = (await headers()).get(PATHNAME_HEADER) ?? '/'
  return {
    ...baseMetadata,
    title: { template: t('titleTemplate'), default: t('title') },
    description: t('description'),
    openGraph: {
      ...baseMetadata.openGraph,
      locale: OG_LOCALES[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
      url: localeAlternates(pathname, locale)?.canonical as string,
      title: t('ogTitle'),
      description: t('ogDescription'),
      ...(locale === 'hi'
        ? {
            images: [{
              url: `${BASE_URL}/opengraph-image?lang=hi`,
              width: 1200,
              height: 630,
              alt: 'Vedaansh — निःशुल्क वैदिक ज्योतिष',
            }],
          }
        : {}),
    },
    twitter: {
      ...baseMetadata.twitter,
      title: t('ogTitle'),
      description: t('ogDescription'),
      ...(locale === 'hi' ? { images: [`${BASE_URL}/opengraph-image?lang=hi`] } : {}),
    },
    alternates: localeAlternates(pathname, locale),
  }
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
  description:   'Free Vedic astrology platform — birth charts, Dasha, 16 vargas, Panchang.',
  publisher:     { '@type': 'Organization', name: 'Vedaansh', url: BASE_URL },
  hasPart: [
    { '@type': 'WebPage', name: 'Daily Panchang', url: `${BASE_URL}/panchang` },
    { '@type': 'WebPage', name: 'Muhurta Finder', url: `${BASE_URL}/muhurta` },
    { '@type': 'WebPage', name: 'Kundali Matching', url: `${BASE_URL}/compare` },
    { '@type': 'WebPage', name: 'Nakshatra Analysis', url: `${BASE_URL}/nakshatra` },
    { '@type': 'WebPage', name: 'Jyotish Guides', url: `${BASE_URL}/guides` },
  ],
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type':         'EntryPoint',
      urlTemplate:     `${BASE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
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
  description: 'Calculate free Vedic birth charts (Kundali), Vimshottari Dasha, Navamsha, 16 Shodashavarga charts, Panchang & Arudhas with arc-second Swiss Ephemeris accuracy.',
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
  const rawLocale = await getLocale()
  const locale = isAppLocale(rawLocale) ? rawLocale : 'en'
  const clientMessages = pickNamespaces(
    (await getMessages()) as Record<string, unknown>,
    ROOT_CLIENT_NAMESPACES,
  ) as AbstractIntlMessages

  return (
    <html lang={LOCALE_TAGS[locale]} suppressHydrationWarning data-scroll-behavior="smooth" className={`${newsreader.variable} ${inter.variable} ${plexMono.variable} ${jetbrainsMono.variable} ${notoDevanagari.variable}`}>
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
        <Script id="theme-init" strategy="beforeInteractive" nonce={nonce}>
          {themeScript}
        </Script>
        <script
          id="ld-website"
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify({ ...jsonLdWebSite, inLanguage: LOCALE_TAGS[locale] }) }}
        />
        <script
          id="ld-webapp"
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify({ ...jsonLdWebApp, inLanguage: LOCALE_TAGS[locale] }) }}
        />
        <script
          id="ld-org"
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
      </head>
      <body>
        <IntlProvider locale={locale} messages={clientMessages}>
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
        </IntlProvider>
      </body>
    </html>
  )
}