import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { ROADMAP_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Transit Hub — Live Gochar & Forecast | Vedaansh',
  description: 'Personal Vedic transit hub: Live Transit scrubber, Forecast, Moon Passages, and Cosmic Roadmap with Vimshottari dasha overlay.',
  alternates:  { canonical: `${SITE_URL}/transit/scrubber` },
  keywords:    ['Vedic transit', 'gochar', 'planetary transit', 'Dasha timeline', 'Jyotish roadmap', 'transit calendar', 'personal astrology forecast', 'Moon transit'],
  openGraph: {
    title:       'Transit Hub | Vedaansh',
    description: 'Live gochar scrubber, Moon passages, Forecast, and Cosmic Roadmap with Mahadasha/Antardasha overlay.',
    url:         `${SITE_URL}/transit/scrubber`,
    type:        'website',
    images:      routeOgImage('/transit', 'Transit Hub — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Transit Hub | Vedaansh',
    description: 'Live Transit, Forecast, Moon Passages, and Cosmic Roadmap in one hub.',
    images:      [`${SITE_URL}/transit/opengraph-image`],
  },
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Transit', path: '/transit/scrubber' },
])

export default async function TransitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
      <SeoIntro {...ROADMAP_SEO} />
    </>
  )
}
