import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { ROADMAP_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Personal Transit Roadmap — Vedaansh',
  description: 'Your personal Vedic transit roadmap: upcoming planetary transits, Dasha periods & key astrological windows visualised on an interactive timeline.',
  alternates:  { canonical: `${SITE_URL}/transit/roadmap` },
  keywords:    ['Vedic transit', 'planetary transit', 'Dasha timeline', 'Jyotish roadmap', 'transit calendar', 'personal astrology forecast'],
  openGraph: {
    title:       'Personal Transit Roadmap | Vedaansh',
    description: 'Upcoming planetary transits, Dasha periods & key astrological windows on an interactive Vedic timeline.',
    url:         `${SITE_URL}/transit/roadmap`,
    type:        'website',
    images:      routeOgImage('/transit', 'Transit Hub — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Personal Transit Roadmap | Vedaansh',
    description: 'Upcoming planetary transits, Dasha periods & key astrological windows on an interactive timeline.',
    images:      [`${SITE_URL}/transit/opengraph-image`],
  },
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Transit Roadmap', path: '/transit/roadmap' },
])

export default async function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
      <SeoIntro {...ROADMAP_SEO} />
    </>
  )
}
