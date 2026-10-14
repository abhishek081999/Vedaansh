import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Search',
  description: 'Search Vedaansh tools and Jyotish guides — Kundali, Panchang, Muhurta, matching, and more.',
  alternates:  { canonical: `${SITE_URL}/search` },
  robots:      { index: true, follow: true },
  openGraph: {
    title:       'Search Vedaansh',
    description: 'Find Vedic astrology tools and guides on Vedaansh.',
    url:         `${SITE_URL}/search`,
    type:        'website',
  },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
