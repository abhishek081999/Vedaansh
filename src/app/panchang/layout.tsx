import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { PANCHANG_SEO } from '@/lib/seo/intro-content'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Daily Panchang — Vedic Calendar',
  description: 'Free daily Vedic Panchang: Tithi, Vara, Nakshatra, Yoga, Karana, Rahu Kalam, Gulika & Abhijit Muhurta. Real sunrise/sunset via Swiss Ephemeris.',
  alternates:  { canonical: `${BASE_URL}/panchang` },
  openGraph: {
    title:       'Daily Panchang — Vedaansh',
    description: 'Free daily Vedic Panchang with astronomical sunrise, Rahu Kalam, Nakshatra & Hora table.',
    url:         `${BASE_URL}/panchang`,
    type:        'website',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Daily Panchang — Vedaansh' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Daily Panchang — Vedaansh',
    description: 'Tithi, Nakshatra, Yoga, Karana, Rahu Kalam & Hora table — free every day.',
    images:      ['/og-default.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type':    'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home',     item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Panchang', item: `${BASE_URL}/panchang` },
  ],
}

export default async function PanchangLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoIntro {...PANCHANG_SEO} />
      <JsonLd data={jsonLd} />
      {children}
    </>
  )
}