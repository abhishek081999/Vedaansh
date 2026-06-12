import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { VASTU_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, ogImages, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Vastu Shastra — Directional Astrology from Kundali',
  description: 'Vedic Vastu analysis from your birth chart: planetary directions, Dig Bala, Vastu Dosha identification, room guidance, and remedies.',
  alternates:  { canonical: `${SITE_URL}/vastu` },
  keywords:    ['Vastu Shastra', 'Vastu astrology', 'Dig Bala', 'Digbala', 'directional strength', 'Vastu Dosha', 'planetary directions', 'Jyotish Vastu', 'Astro Vastu'],
  openGraph: {
    title:       'Vastu Shastra — Directional Astrology | Vedaansh',
    description: 'Planetary directions, Dig Bala & Vastu Dosha analysis from your Vedic birth chart.',
    url:         `${SITE_URL}/vastu`,
    type:        'website',
    images:      ogImages('Vastu Shastra — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Vastu Shastra — Directional Astrology | Vedaansh',
    description: 'Planetary directions, Dig Bala & Vastu Dosha analysis from your Vedic birth chart.',
    images:      ['/og-default.png'],
  },
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Vastu', path: '/vastu' },
])

export default async function VastuLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoIntro {...VASTU_SEO} />
      <JsonLd data={jsonLd} />
      {children}
    </>
  )
}
