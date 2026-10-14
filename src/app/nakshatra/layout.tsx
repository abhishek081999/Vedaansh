import type { Metadata } from 'next'
import { routeOgImage } from '@/lib/seo/site'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { NAKSHATRA_SEO } from '@/lib/seo/intro-content'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Nakshatra Analysis — Vedic Astrology',
  description: 'Deep Nakshatra analysis: Pada, ruling deity, planet, compatibility, remedies, Yogini Dasha & transit activation. Swiss Ephemeris precision for all 27 Nakshatras.',
  alternates:  { canonical: `${BASE_URL}/nakshatra` },
  keywords:    ['Nakshatra', 'Vedic nakshatra', 'birth star', 'Pada', 'Yogini dasha', 'nakshatra compatibility', 'Ashwini', 'Rohini', 'Hasta'],
  openGraph: {
    title:       'Nakshatra Analysis — Vedaansh',
    description: 'All 27 Nakshatras — Pada, deity, planet, Yogini Dasha & remedies. Swiss Ephemeris accuracy.',
    url:         `${BASE_URL}/nakshatra`,
    type:        'website',
    images:      routeOgImage('/nakshatra', 'Nakshatra Analysis — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Nakshatra Analysis — Vedaansh',
    description: 'All 27 Nakshatras — Pada, deity, planet, Yogini Dasha & remedies.',
    images:      [`${BASE_URL}/nakshatra/opengraph-image`],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type':    'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home',      item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Nakshatra', item: `${BASE_URL}/nakshatra` },
  ],
}

export default async function NakshatraLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
      <SeoIntro {...NAKSHATRA_SEO} />
    </>
  )
}
