import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { PANCHANG_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, ogImages, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Free Daily Panchang — Tithi, Nakshatra & Rahu Kalam',
  description: 'Free daily Vedic Panchang: Tithi, Vara, Nakshatra, Yoga, Karana, Rahu Kalam, Gulika & Abhijit Muhurta. Real sunrise/sunset via Swiss Ephemeris.',
  alternates:  { canonical: `${SITE_URL}/panchang` },
  keywords:    ['Panchang', 'daily panchang', 'Tithi', 'Nakshatra', 'Rahu Kalam', 'Abhijit Muhurta', 'Hora table', 'Vedic calendar', 'Hindu panchang'],
  openGraph: {
    title:       'Daily Panchang — Vedaansh',
    description: 'Free daily Vedic Panchang with astronomical sunrise, Rahu Kalam, Nakshatra & Hora table.',
    url:         `${SITE_URL}/panchang`,
    type:        'website',
    images:      ogImages('Daily Panchang — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Daily Panchang — Vedaansh',
    description: 'Tithi, Nakshatra, Yoga, Karana, Rahu Kalam & Hora table — free every day.',
    images:      ['/og-default.png'],
  },
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Panchang', path: '/panchang' },
])

export default async function PanchangLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoIntro {...PANCHANG_SEO} />
      <JsonLd data={jsonLd} />
      {children}
    </>
  )
}