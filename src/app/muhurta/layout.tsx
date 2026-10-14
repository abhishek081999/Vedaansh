import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { MUHURTA_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Muhurta Finder — Auspicious Time & Shubh Muhurat',
  description: 'Gold Muhurta finder for weddings, griha pravesh, travel, and business. Scores days by Tithi, Nakshatra, Yoga, Karana, Rahu Kalam, and personal Tara/Chandra Bala.',
  alternates:  { canonical: `${SITE_URL}/muhurta` },
  keywords:    ['Muhurta', 'auspicious time', 'Vedic election astrology', 'wedding Muhurta', 'Shubh Muhurta', 'Rahu Kalam', 'Tithi', 'Nakshatra timing'],
  openGraph: {
    title:       'Muhurta — Auspicious Time Selector | Vedaansh',
    description: 'Tithi, Nakshatra, Yoga, Karana & personal Dasha analysis to find your perfect auspicious time.',
    url:         `${SITE_URL}/muhurta`,
    type:        'website',
    images:      routeOgImage('/muhurta', 'Muhurta — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Muhurta — Auspicious Time Selector | Vedaansh',
    description: 'Find your perfect auspicious Muhurta using Vedic Panchang & personal Dasha compatibility.',
    images:      [`${SITE_URL}/muhurta/opengraph-image`],
  },
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Muhurta', path: '/muhurta' },
])

export default async function MuhurtaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
      <SeoIntro {...MUHURTA_SEO} />
    </>
  )
}
