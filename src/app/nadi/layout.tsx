import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { NADI_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Nadi Astrology — Chart, Positions & Dasha',
  description: 'Nadi Astrology workspace on your Vedic birth chart: rashi chart, planetary positions, and the running dasha.',
  alternates: { canonical: `${SITE_URL}/nadi` },
  keywords: ['Nadi astrology', 'Bhrigu Nandi Nadi', 'Vedic chart', 'planetary positions', 'Vimshottari dasha'],
  openGraph: {
    title: 'Nadi Astrology — Chart, Positions & Dasha | Vedaansh',
    description: 'Birth chart, planetary positions, and dasha in the Nadi Astrology workspace.',
    url: `${SITE_URL}/nadi`,
    type: 'website',
    images: routeOgImage('/nadi', 'Nadi Astrology — Vedaansh'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nadi Astrology — Chart, Positions & Dasha | Vedaansh',
    description: 'Birth chart, planetary positions, and dasha in the Nadi Astrology workspace.',
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
