import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { ACG_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Astrocartography — Vedic Locality Charts',
  description: 'Vedic Astrocartography (ACG): find your power locations worldwide using planetary lines, Parivartana zones & relocation chart strength analysis.',
  alternates:  { canonical: `${SITE_URL}/acg` },
  keywords:    ['astrocartography', 'Vedic locality chart', 'ACG', 'planetary lines', 'relocation astrology', 'power locations', 'Jyotish ACG'],
  openGraph: {
    title:       'Astrocartography — Vedic Locality Charts | Vedaansh',
    description: 'Find your power locations worldwide using Vedic planetary lines & relocation chart analysis.',
    url:         `${SITE_URL}/acg`,
    type:        'website',
    images:      routeOgImage('/acg', 'Astrocartography — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Astrocartography — Vedic Locality Charts | Vedaansh',
    description: 'Find your power locations worldwide using Vedic planetary lines & relocation chart analysis.',
    images:      [`${SITE_URL}/acg/opengraph-image`],
  },
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Astrocartography', path: '/acg' },
])

export default async function ACGLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
      <SeoIntro {...ACG_SEO} />
    </>
  )
}
