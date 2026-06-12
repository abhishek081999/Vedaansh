import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { COMPARE_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, ogImages, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Free Kundali Matching — Ashtakoot Guna Milan',
  description: 'Free Kundali matching with 36-point Ashtakoot Guna Milan, Mangal Dosha checks, and side-by-side Vedic chart comparison. No login required.',
  alternates:  { canonical: `${SITE_URL}/compare` },
  keywords:    ['Kundali matching', 'free kundali matching', 'Ashtakoot', 'Guna Milan', 'synastry', 'chart comparison', 'Mangal Dosha', 'Vedic compatibility', 'marriage matching'],
  openGraph: {
    title:       'Free Kundali Matching — Ashtakoot Guna Milan | Vedaansh',
    description: '36-point Ashtakoot scoring, dosha analysis, and dual birth-chart comparison — free.',
    url:         `${SITE_URL}/compare`,
    type:        'website',
    images:      ogImages('Kundali Matching — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Free Kundali Matching — Ashtakoot Guna Milan | Vedaansh',
    description: '36-point Ashtakoot scoring, dosha analysis, and dual birth-chart comparison — free.',
    images:      ['/og-default.png'],
  },
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Kundali Matching', path: '/compare' },
])

export default async function CompareLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoIntro {...COMPARE_SEO} />
      <JsonLd data={jsonLd} />
      {children}
    </>
  )
}
