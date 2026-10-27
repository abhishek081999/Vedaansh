import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { NADI_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Nadi Astrology — Houses, Yogas & Timing',
  description: 'Nadi Astrology on your Vedic birth chart: the active reading, twelve houses, yogas, marriage, career, wealth, coming years, transits, and remedies.',
  alternates: { canonical: `${SITE_URL}/nadi` },
  keywords: ['Nadi astrology', 'Bhrigu Nandi Nadi', 'Vedic chart', 'planetary positions', 'Vimshottari dasha'],
  openGraph: {
    title: 'Nadi Astrology — Houses, Yogas & Timing | Vedaansh',
    description: 'Active Nadi reading on your birth chart: houses, yogas, marriage, career, wealth, coming years, and the live sky.',
    url: `${SITE_URL}/nadi`,
    type: 'website',
    images: routeOgImage('/nadi', 'Nadi Astrology — Vedaansh'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nadi Astrology — Houses, Yogas & Timing | Vedaansh',
    description: 'Active Nadi reading on your birth chart: houses, yogas, marriage, career, wealth, coming years, and the live sky.',
    images: [`${SITE_URL}/nadi/opengraph-image`],
  },
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Nadi Astrology', path: '/nadi' },
])

export default async function NadiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
      <SeoIntro {...NADI_SEO} />
    </>
  )
}
