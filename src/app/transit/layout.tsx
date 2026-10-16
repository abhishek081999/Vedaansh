import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { ROADMAP_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Transit Hub — Roadmap & Live Gochar | Vedaansh',
  description: 'Personal Vedic transit hub: Cosmic Roadmap with Vimshottari dasha overlay, and Live Transit scrubber against your natal chart.',
  alternates:  { canonical: `${SITE_URL}/transit/roadmap` },
  keywords:    ['Vedic transit', 'gochar', 'planetary transit', 'Dasha timeline', 'Jyotish roadmap', 'transit calendar', 'personal astrology forecast'],
  openGraph: {
    title:       'Transit Hub | Vedaansh',
    description: 'Upcoming planetary transits with Mahadasha/Antardasha overlay, plus a live gochar scrubber.',
    url:         `${SITE_URL}/transit/roadmap`,
    type:        'website',
    images:      routeOgImage('/transit', 'Transit Hub — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Transit Hub | Vedaansh',
    description: 'Roadmap + live gochar with Vimshottari dasha periods on one timeline.',
    images:      [`${SITE_URL}/transit/opengraph-image`],
  },
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Transit', path: '/transit/roadmap' },
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
