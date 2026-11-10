import type { Metadata } from 'next'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Search',
  description: 'Search Vedaansh tools and Jyotish guides — Kundali, Panchang, Muhurta, matching, and more.',
  alternates: { canonical: `${SITE_URL}/search` },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Search Vedaansh',
    description: 'Find Vedic astrology tools and guides on Vedaansh.',
    url: `${SITE_URL}/search`,
    type: 'website',
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/search', await pageLocale(), metadataEn, {
    title: 'खोज',
    description: 'Vedaansh उपकरण और ज्योतिष गाइड खोजें — कुंडली, पंचांग, मुहूर्त, मिलान और अधिक।',
    ogTitle: 'Vedaansh खोजें',
    ogDescription: 'Vedaansh पर वैदिक ज्योतिष उपकरण और गाइड खोजें।',
  })
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
